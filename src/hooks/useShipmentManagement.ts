import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('PDF');

  const calculateRowTotal = (shipment: BulkShipment): number => {
    const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
    const shippingCost = selectedRate ? parseFloat(selectedRate.rate.toString()) : 0;
    const insuranceCost = shipment.insurance_amount || 0;
    return shippingCost + insuranceCost;
  };

  const calculateGrandTotal = (): number => {
    if (!results) return 0;
    
    return results.processedShipments.reduce((total, shipment) => {
      return total + calculateRowTotal(shipment);
    }, 0);
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + calculateRowTotal(shipment);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success('Shipment removed');
  };

  const handleEditShipment = (shipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(s => {
      return s.id === shipment.id ? shipment : s;
    });
    
    const newTotalCost = updatedShipments.reduce((total, s) => {
      return total + calculateRowTotal(s);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success('Shipment updated');
  };

  const handleProceedToPayment = async () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Check if all shipments have selected rates
      const missingRates = results.processedShipments.filter(s => !s.selectedRateId);
      
      if (missingRates.length > 0) {
        throw new Error(`${missingRates.length} shipments are missing selected rates`);
      }
      
      // Calculate total cost including insurance for each shipment
      const totalAmount = calculateGrandTotal();
      
      // Process payment via Edge Function
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          shipments: results.processedShipments.map(shipment => ({
            ...shipment,
            rowTotal: calculateRowTotal(shipment)
          })),
          pickupAddress: results.pickupAddress,
          paymentMethod: 'bulk_processing',
          totalAmount: totalAmount
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state with result and automatically proceed to label creation
      updateResults({
        ...results,
        ...data,
        uploadStatus: 'success'
      });
      
      toast.success(`Payment processed successfully for $${totalAmount.toFixed(2)}`);
      
      // Automatically start label creation after successful payment
      setTimeout(() => {
        handleCreateLabels();
      }, 1000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + (error as Error).message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = async (labelOptions?: { format?: string; size?: string }) => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Create labels using the batch processing function
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: { 
          shipments: results.processedShipments,
          pickupAddress: results.pickupAddress,
          labelOptions: labelOptions || { format: 'PDF', size: '4x6' }
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state with generated labels
      updateResults({
        ...results,
        processedShipments: data.processedLabels,
        uploadStatus: 'success'
      });
      
      toast.success(`Generated ${data.successful} labels successfully`);
      
      if (data.failed > 0) {
        toast.warning(`${data.failed} labels failed to generate`);
      }
      
    } catch (error) {
      console.error('Label generation error:', error);
      toast.error('Failed to generate labels: ' + (error as Error).message);
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!results || !results.processedShipments.some(s => s.label_url)) {
      setShowLabelOptions(true);
      return;
    }
    
    // Download all existing labels
    results.processedShipments.forEach(shipment => {
      if (shipment.label_url) {
        window.open(shipment.label_url, '_blank');
      }
    });
  };

  const handleDownloadLabelsWithFormat = async (format: string) => {
    setIsCreatingLabels(true);
    
    try {
      await handleCreateLabels({ format, size: '4x6' });
      setShowLabelOptions(false);
      
      // Download the generated labels
      setTimeout(() => {
        if (results) {
          results.processedShipments.forEach(shipment => {
            if (shipment.label_url) {
              window.open(shipment.label_url, '_blank');
            }
          });
        }
      }, 1000);
      
      toast.success(`Labels downloaded in ${format.toUpperCase()} format`);
    } catch (error) {
      console.error('Label download error:', error);
      toast.error('Failed to download labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadSingleLabel = (shipmentId: string) => {
    if (!results) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    
    if (shipment && shipment.label_url) {
      window.open(shipment.label_url, '_blank');
    } else {
      toast.error('Label not available for this shipment');
    }
  };

  const handleEmailLabels = async (email: string) => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to email');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Send email via Edge Function
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: { 
          shipments: results.processedShipments,
          email,
          type: 'bulk_domestic'
        }
      });
      
      if (error) {
        throw error;
      }
      
      setShowLabelOptions(false);
      toast.success(`Labels emailed to ${email}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to email labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  return {
    isPaying,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    calculateRowTotal,
    calculateGrandTotal,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    setShowLabelOptions,
    setDownloadFormat,
  };
};

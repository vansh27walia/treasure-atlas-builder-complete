
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

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const newTotalCost = calculateTotalCost(updatedShipments);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success('Shipment removed');
  };

  const calculateTotalCost = (shipments: BulkShipment[]): number => {
    return shipments.reduce((total, shipment) => {
      const shippingCost = shipment.rate || 0;
      const insuranceCost = 2.00; // Fixed insurance cost per shipment
      return total + shippingCost + insuranceCost;
    }, 0);
  };

  const handleEditShipment = (shipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(s => {
      return s.id === shipment.id ? shipment : s;
    });
    
    const newTotalCost = calculateTotalCost(updatedShipments);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success('Shipment updated');
  };

  const handleRateChange = async (shipmentId: string, newRateId: string) => {
    if (!results) return;

    // Find the shipment
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipment) return;

    try {
      // Re-fetch all rates for this shipment with any updated details
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: results.pickupAddress,
          toAddress: {
            name: shipment.details?.name,
            company: shipment.details?.company,
            street1: shipment.details?.street1,
            street2: shipment.details?.street2,
            city: shipment.details?.city,
            state: shipment.details?.state,
            zip: shipment.details?.zip,
            country: shipment.details?.country,
            phone: shipment.details?.phone,
          },
          parcel: {
            length: shipment.details?.parcel_length || 8,
            width: shipment.details?.parcel_width || 6,
            height: shipment.details?.parcel_height || 4,
            weight: shipment.details?.parcel_weight || 16,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data && data.rates) {
        // Update the shipment with new rates and selected rate
        const selectedRate = data.rates.find((rate: any) => rate.id === newRateId) || data.rates[0];
        
        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s,
              availableRates: data.rates,
              selectedRateId: selectedRate.id,
              carrier: selectedRate.carrier,
              service: selectedRate.service,
              rate: parseFloat(selectedRate.rate),
            };
          }
          return s;
        });

        const newTotalCost = calculateTotalCost(updatedShipments);
        
        updateResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: newTotalCost,
        });
        
        toast.success('Rates updated and applied');
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('Failed to update rates');
    }
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
      
      // Calculate total including insurance
      const totalWithInsurance = calculateTotalCost(results.processedShipments);
      
      // Process payment via Edge Function
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          shipments: results.processedShipments,
          pickupAddress: results.pickupAddress,
          totalAmount: totalWithInsurance,
          includeInsurance: true,
          paymentMethod: 'bulk_processing'
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Update state with payment success
      updateResults({
        ...results,
        totalCost: totalWithInsurance,
        uploadStatus: 'success'
      });
      
      // Automatically start label creation after payment
      await handleCreateLabels();
      
      toast.success(`Payment processed successfully for $${totalWithInsurance.toFixed(2)}`);
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
      // Create labels using the enhanced batch processing
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: { 
          shipments: results.processedShipments,
          pickupAddress: results.pickupAddress,
          labelOptions: labelOptions || { format: 'PDF', size: '4x6' },
          includeInsurance: true
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
          type: 'bulk_domestic',
          includeInsurance: true
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
    handleRemoveShipment,
    handleEditShipment,
    handleRateChange,
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

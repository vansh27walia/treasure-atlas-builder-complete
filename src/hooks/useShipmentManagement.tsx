
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export const useShipmentManagement = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleRemoveShipment = (shipmentId: string) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Recalculate totals
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed');
  };

  const handleEditShipment = (shipmentId: string, details: BulkShipment['details']) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        return { 
          ...shipment, 
          details: {
            ...shipment.details,
            ...details
          }
        };
      }
      return shipment;
    });
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments
    });
    
    toast.success('Shipment updated');
  };
  
  const handleProceedToPayment = async () => {
    if (!initialResults) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Calculate total amount in cents for Stripe
      const amountInCents = Math.round(initialResults.totalCost * 100);
      
      // Create checkout session with Stripe
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: { 
          amount: amountInCents,
          quantity: initialResults.successful,
          description: `Bulk Shipping - ${initialResults.successful} labels`,
          metadata: {
            shipment_ids: initialResults.processedShipments.map(s => s.id).join(',')
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = () => {
    if (!initialResults) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    // Labels are already generated, just simulate completion
    setTimeout(() => {
      setIsCreatingLabels(false);
      toast.success(`${initialResults.successful} shipping labels have been generated`);
      navigate('/dashboard?tab=tracking');
    }, 1000);
  };

  const handleDownloadAllLabels = () => {
    if (!initialResults || !initialResults.processedShipments.length) {
      toast.error('No labels available to download');
      return;
    }
    
    // In a real app, this would download a ZIP file with all labels
    // For this demo, we'll open the first label URL as an example
    toast.success(`Preparing ${initialResults.successful} labels for download`);
    const firstShipment = initialResults.processedShipments[0];
    const labelUrl = firstShipment.label_url || '';
    if (labelUrl) {
      window.open(labelUrl, '_blank');
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };

  return {
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadSingleLabel
  };
};


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export const useShipmentManagement = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');

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
    
    toast("Shipment removed", {
      description: "The shipment has been removed from your list"
    });
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
    
    toast("Shipment updated", {
      description: "The shipment details have been updated"
    });
  };
  
  const handleProceedToPayment = async () => {
    if (!initialResults) {
      toast("Error", {
        description: "No shipments to process"
      });
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
      
      // Update with label creation before redirecting to payment
      await handleCreateLabels();
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast("Payment failed", {
        description: error instanceof Error ? error.message : "Failed to process payment"
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = async () => {
    if (!initialResults || initialResults.processedShipments.length === 0) {
      toast("Error", {
        description: "No shipments to process"
      });
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Process each shipment to create labels
      const updatedShipments = [...initialResults.processedShipments];
      let successCount = 0;
      
      for (const shipment of updatedShipments) {
        if (!shipment.selectedRateId) continue;
        
        try {
          // Make API call to create label
          const { data, error } = await supabase.functions.invoke('create-label', {
            body: { 
              shipmentId: shipment.id, 
              rateId: shipment.selectedRateId,
              options: {
                label_format: downloadFormat.toUpperCase(),
                label_size: "4x6"
              }
            }
          });

          if (error) throw new Error(error.message);
          
          // Update shipment with label URL and tracking code
          const index = updatedShipments.findIndex(s => s.id === shipment.id);
          if (index >= 0) {
            updatedShipments[index] = {
              ...shipment,
              label_url: data.labelUrl,
              tracking_code: data.trackingCode,
              status: 'completed' as const
            };
            successCount++;
          }
        } catch (error) {
          console.error(`Error creating label for shipment ${shipment.id}:`, error);
        }
      }
      
      // Update results with labels
      updateResults({
        ...initialResults,
        processedShipments: updatedShipments
      });
      
      if (successCount > 0) {
        toast("Label generation complete", {
          description: `Generated ${successCount} shipping labels`
        });
        
        // Set status to success for the BulkUpload component to show success view
        updateResults({
          ...initialResults,
          processedShipments: updatedShipments,
          totalCost: initialResults.totalCost,
          successful: successCount,
          failed: initialResults.processedShipments.length - successCount
        });
        
        // Update upload status in parent component
        setUploadStatus('success');
      } else {
        toast("Label generation failed", {
          description: "No labels were generated, please try again"
        });
      }
    } catch (error) {
      console.error('Error creating labels:', error);
      toast("Label generation failed", {
        description: error instanceof Error ? error.message : "Failed to generate labels"
      });
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!initialResults || !initialResults.processedShipments.length) {
      toast("No labels", {
        description: "No labels available to download"
      });
      return;
    }
    
    // Show label options modal
    setShowLabelOptions(true);
  };

  const [showLabelOptions, setShowLabelOptions] = useState(false);
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!initialResults || !initialResults.processedShipments.length) return;
    
    setShowLabelOptions(false);
    
    if (format === 'zip') {
      // Handle ZIP download - in a real app this would call a backend endpoint
      toast("Preparing ZIP file", {
        description: `Creating ZIP archive with ${initialResults.processedShipments.length} labels`
      });
      
      // Simulate ZIP download for now
      setTimeout(() => {
        toast("Download ready", {
          description: "Your labels ZIP file is ready to download"
        });
        
        // Open first label as example
        const firstShipment = initialResults.processedShipments.find(s => s.label_url);
        if (firstShipment?.label_url) {
          window.open(firstShipment.label_url, '_blank');
        }
      }, 1500);
      return;
    }
    
    // Set format for future downloads
    setDownloadFormat(format as 'pdf' | 'png' | 'zpl');
    
    // For individual formats, open each label in new tab
    const labelsWithUrls = initialResults.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      // No labels yet, generate them first
      handleCreateLabels();
      return;
    }
    
    toast("Opening labels", {
      description: `Opening ${labelsWithUrls.length} labels in ${format.toUpperCase()} format`
    });
    
    // Open first 3 labels maximum to avoid browser popup blocking
    labelsWithUrls.slice(0, 3).forEach(shipment => {
      if (shipment.label_url) {
        window.open(shipment.label_url, '_blank');
      }
    });
    
    if (labelsWithUrls.length > 3) {
      toast("More labels available", {
        description: `${labelsWithUrls.length - 3} more labels are available for individual download`
      });
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };
  
  const handleEmailLabels = () => {
    toast("Email feature", {
      description: "Email labels feature will be implemented soon"
    });
  };
  
  // This function is needed for the updated component but doesn't exist in the original hook
  const setUploadStatus = (status: 'idle' | 'success' | 'error' | 'editing') => {
    // This should be passed from the parent hook
    if (initialResults) {
      updateResults({
        ...initialResults,
        uploadStatus: status
      });
    }
  };

  return {
    isPaying,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    setShowLabelOptions,
    setDownloadFormat
  };
};

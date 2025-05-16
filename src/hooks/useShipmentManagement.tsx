
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
  const [showLabelOptions, setShowLabelOptions] = useState(false);

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
    toast.loading("Generating shipping labels...");
    
    try {
      // Process each shipment to create labels
      const updatedShipments = [...initialResults.processedShipments];
      let successCount = 0;
      let pendingLabels = updatedShipments.length;
      
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
          
          // Update progress in the UI
          pendingLabels--;
          toast.loading(`Generating labels: ${successCount} complete, ${pendingLabels} remaining`);
        } catch (error) {
          console.error(`Error creating label for shipment ${shipment.id}:`, error);
        }
      }
      
      // Update results with labels
      updateResults({
        ...initialResults,
        processedShipments: updatedShipments,
        totalCost: initialResults.totalCost,
        successful: successCount,
        failed: initialResults.processedShipments.length - successCount,
        uploadStatus: 'success' 
      });
      
      toast.dismiss();
      
      if (successCount > 0) {
        toast.success(`Generated ${successCount} shipping labels`);
      } else {
        toast.error("No labels were generated, please try again");
      }
    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error("Label generation failed", {
        description: error instanceof Error ? error.message : "Failed to generate labels"
      });
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!initialResults || !initialResults.processedShipments.length) {
      toast.error("No labels", {
        description: "No labels available to download"
      });
      return;
    }
    
    const labelsWithUrls = initialResults.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      // No labels yet, generate them first
      toast("Generating labels first", {
        description: "Please wait while we generate your labels"
      });
      handleCreateLabels();
      return;
    }
    
    // Show label options modal for download format selection
    setShowLabelOptions(true);
  };

  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!initialResults || !initialResults.processedShipments.length) return;
    
    setShowLabelOptions(false);
    setDownloadFormat(format as 'pdf' | 'png' | 'zpl');
    
    const labelsWithUrls = initialResults.processedShipments.filter(s => s.label_url);
    
    if (format === 'zip') {
      // Use international label edge function for batch download
      handleBatchDownload(labelsWithUrls);
    } else {
      // For individual formats, use batch download for consistency
      handleBatchDownload(labelsWithUrls, format);
    }
  };
  
  const handleBatchDownload = async (shipments: BulkShipment[], format: string = 'pdf') => {
    toast.loading("Preparing labels for download...");
    
    try {
      // Simulate a backend call to prepare all labels
      // In production, this would call an edge function to prepare a ZIP file
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.dismiss();
      toast.success("Labels ready for download");
      
      // Open the first label for demonstration
      // In production, this would download a ZIP file with all labels
      if (shipments.length > 0 && shipments[0].label_url) {
        window.open(shipments[0].label_url, '_blank');
        
        if (shipments.length > 1) {
          toast.info(`Showing first label as example. In production, all ${shipments.length} labels would be combined in a ZIP file.`);
        }
      }
    } catch (error) {
      toast.error("Failed to prepare labels for download");
      console.error("Batch download error:", error);
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };
  
  const handleEmailLabels = () => {
    toast("Email feature", {
      description: "Email labels feature will be implemented soon"
    });
    setShowLabelOptions(false);
  };
  
  const handleViewShipment = (shipmentId: string) => {
    // This method will be passed to the SuccessfulShipmentsTable component
    // The view dialog is handled in the SuccessNotification component
  };
  
  // Set upload status (this needs to be exposed for use in the BulkUpload component)
  const setUploadStatus = (status: 'idle' | 'success' | 'error' | 'editing') => {
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
    handleViewShipment,
    setShowLabelOptions,
    setDownloadFormat,
    setUploadStatus
  };
};


import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
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
  const [labelPreviewUrl, setLabelPreviewUrl] = useState<string | null>(null);
  const [showLabelPreview, setShowLabelPreview] = useState(false);

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
          // Generate label locally and save to indexedDB
          const labelUrl = await generateAndSaveLabel(shipment, downloadFormat);
          
          // Update shipment with label URL and tracking code
          const index = updatedShipments.findIndex(s => s.id === shipment.id);
          if (index >= 0) {
            updatedShipments[index] = {
              ...shipment,
              label_url: labelUrl,
              tracking_code: generateTrackingCode(), // Generate locally
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
        toast.success(`Generated ${successCount} shipping labels`);
        
        // Set status to success for the BulkUpload component to show success view
        updateResults({
          ...initialResults,
          processedShipments: updatedShipments,
          totalCost: initialResults.totalCost,
          successful: successCount,
          failed: initialResults.processedShipments.length - successCount,
          uploadStatus: 'success'
        });
      } else {
        toast.error("No labels were generated, please try again");
      }
    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : "Failed to generate labels");
    } finally {
      setIsCreatingLabels(false);
    }
  };

  // Generate and save label locally
  const generateAndSaveLabel = async (shipment: BulkShipment, format: string): Promise<string> => {
    // In a real app, this would generate labels using client-side libraries
    // For demo, we'll simulate with a delay and return a mock URL
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For a real implementation, you would use:
    // - PDF.js for PDF generation
    // - Canvas API for PNG creation
    // - A ZPL library for ZPL format
    
    let mockUrl;
    
    if (format === 'pdf') {
      mockUrl = 'https://assets.easypost.com/shipping_labels/example_label.pdf';
    } else if (format === 'png') {
      mockUrl = 'https://assets.easypost.com/shipping_labels/example_label.png';
    } else {
      mockUrl = 'https://assets.easypost.com/shipping_labels/example_label.zpl';
    }
    
    // Store in browser storage (IndexedDB or LocalStorage)
    try {
      const key = `label_${shipment.id}_${format}`;
      localStorage.setItem(key, mockUrl);
      console.log(`Label saved with key: ${key}`);
    } catch (error) {
      console.error('Error saving label locally:', error);
    }
    
    return mockUrl;
  };
  
  // Generate tracking code locally
  const generateTrackingCode = (): string => {
    const prefix = ['1Z', 'UPS', 'FEDEX', 'DHL', 'USPS'][Math.floor(Math.random() * 5)];
    const numberPart = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${prefix}${numberPart}`;
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
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!initialResults || !initialResults.processedShipments.length) return;
    
    setShowLabelOptions(false);
    
    if (format === 'zip') {
      // Handle ZIP download - in a real app this would create a ZIP file with all labels
      toast("Preparing ZIP file", {
        description: `Creating ZIP archive with ${initialResults.processedShipments.length} labels`
      });
      
      // Simulate ZIP download for now
      setTimeout(() => {
        toast.success("Your labels ZIP file is ready to download");
        
        // Open first label as example
        const firstShipment = initialResults.processedShipments.find(s => s.label_url);
        if (firstShipment?.label_url) {
          showLabelPreviewDialog(firstShipment.label_url);
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
    
    toast.success(`Opening ${labelsWithUrls.length} labels in ${format.toUpperCase()} format`);
    
    // Show preview of first label
    if (labelsWithUrls[0]?.label_url) {
      showLabelPreviewDialog(labelsWithUrls[0].label_url);
    }
    
    // Track which labels have been loaded
    let loadedCount = 0;
    
    // Load labels sequentially to avoid browser popup blocking
    const loadNextLabel = (index: number) => {
      if (index >= labelsWithUrls.length) return;
      
      const shipment = labelsWithUrls[index];
      if (shipment.label_url) {
        // In a real app, use a print library like PrintJS to handle printing
        setTimeout(() => {
          loadedCount++;
          if (loadedCount < 3) {
            loadNextLabel(index + 1);
          } else if (labelsWithUrls.length > 3) {
            toast.success(`${labelsWithUrls.length - 3} more labels are available for individual download`);
          }
        }, 500);
      }
    };
    
    loadNextLabel(0);
  };

  const showLabelPreviewDialog = (labelUrl: string) => {
    setLabelPreviewUrl(labelUrl);
    setShowLabelPreview(true);
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    showLabelPreviewDialog(labelUrl);
  };
  
  const handleEmailLabels = () => {
    toast("Email feature", {
      description: "Email labels feature will be implemented soon"
    });
  };
  
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
    showLabelPreview,
    labelPreviewUrl,
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
    setShowLabelPreview,
    setDownloadFormat,
    setUploadStatus
  };
};


import { useState } from 'react';
import { toast } from 'sonner';
import { BulkUploadResult, BulkShipment, BulkShipmentError } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useShipmentManagement = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl' | 'zip'>('pdf');
  const navigate = useNavigate();

  if (!initialResults) {
    return {
      isPaying,
      isCreatingLabels,
      showLabelOptions,
      downloadFormat,
      handleRemoveShipment: () => {},
      handleEditShipment: () => {},
      handleProceedToPayment: () => {},
      handleCreateLabels: () => {},
      handleDownloadAllLabels: () => {},
      handleDownloadLabelsWithFormat: () => {},
      handleDownloadSingleLabel: () => {},
      handleEmailLabels: () => {},
      setShowLabelOptions,
      setDownloadFormat
    };
  }

  const handleRemoveShipment = (shipmentId: string) => {
    if (!initialResults) return;

    // Filter out the removed shipment
    const updatedShipments = initialResults.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    // Recalculate total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => sum + (shipment.rate || 0), 0);
    
    // Update the failed shipments - Convert BulkShipment to BulkShipmentError format
    const removedShipment = initialResults.processedShipments.find(s => s.id === shipmentId);
    
    const failedShipments: BulkShipmentError[] = [
      ...initialResults.failedShipments,
      ...(removedShipment ? [{
        row: removedShipment.row,
        error: 'Removed by user',
        details: removedShipment.details
      }] : [])
    ];
    
    // Update the results
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      failedShipments,
      successful: updatedShipments.length,
      failed: failedShipments.length,
      totalCost
    });
    
    toast("Shipment removed");
  };

  const handleEditShipment = (shipmentId: string, updatedDetails: any) => {
    if (!initialResults) return;
    
    // Update the shipment details
    const updatedShipments = initialResults.processedShipments.map(shipment => 
      shipment.id === shipmentId 
        ? { ...shipment, details: { ...shipment.details, ...updatedDetails } }
        : shipment
    );
    
    // Update the results
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments
    });
    
    toast("Shipment updated");
  };

  const handleProceedToPayment = async () => {
    if (!initialResults || initialResults.processedShipments.length === 0) {
      toast("No shipments to process");
      return;
    }
    
    setIsPaying(true);
    
    try {
      // For demo purposes, just show a success message and create labels
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast("Payment processed successfully");
      
      // Now create labels for all shipments
      await handleCreateLabels();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast("Payment processing failed");
    } finally {
      setIsPaying(false);
    }
  };

  const handleCreateLabels = async () => {
    if (!initialResults || initialResults.processedShipments.length === 0) {
      toast("No shipments to process");
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      const shipmentsToLabel = initialResults.processedShipments
        .filter(s => !s.label_url && s.selectedRateId);
      
      if (shipmentsToLabel.length === 0) {
        toast("All labels have already been generated");
        setIsCreatingLabels(false);
        return;
      }
      
      toast(`Creating ${shipmentsToLabel.length} labels...`);
      
      const updatedShipments = [...initialResults.processedShipments];
      
      // For each shipment, create a label
      for (let i = 0; i < shipmentsToLabel.length; i++) {
        const shipment = shipmentsToLabel[i];
        const shipmentIndex = updatedShipments.findIndex(s => s.id === shipment.id);
        
        if (shipmentIndex === -1 || !shipment.selectedRateId) continue;
        
        try {
          // Call Edge Function to create label with EasyPost
          const { data, error } = await supabase.functions.invoke('create-label', {
            body: {
              shipmentId: shipment.id,
              rateId: shipment.selectedRateId
            }
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          if (!data || !data.labelUrl) {
            throw new Error('No label data returned');
          }
          
          // Update shipment with label URL and tracking code
          updatedShipments[shipmentIndex] = {
            ...updatedShipments[shipmentIndex],
            label_url: data.labelUrl,
            tracking_code: data.trackingCode
          };
          
        } catch (error) {
          console.error(`Error creating label for shipment ${shipment.id}:`, error);
          updatedShipments[shipmentIndex] = {
            ...updatedShipments[shipmentIndex],
            error: 'Failed to create label'
          };
        }
      }
      
      // Update results with new shipment data
      updateResults({
        ...initialResults,
        processedShipments: updatedShipments,
        uploadStatus: 'success' as const
      });
      
      toast("Labels created successfully");
      
      // Navigate to label success page if only one label was created
      if (updatedShipments.filter(s => s.label_url).length === 1) {
        const shipment = updatedShipments.find(s => s.label_url);
        if (shipment) {
          navigate(`/label-success?labelUrl=${encodeURIComponent(shipment.label_url || '')}&trackingCode=${encodeURIComponent(shipment.tracking_code || '')}&shipmentId=${encodeURIComponent(shipment.id)}`);
        }
      }
      
    } catch (error) {
      console.error('Error creating labels:', error);
      toast("Failed to create some labels");
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    // Show label options modal
    setShowLabelOptions(true);
  };

  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    setDownloadFormat(format);
    setShowLabelOptions(false);
    
    // Simulate download with selected format
    const labelUrls = initialResults.processedShipments
      .filter(s => s.label_url)
      .map(s => s.label_url);
    
    if (labelUrls.length === 0) {
      toast("No labels available to download");
      return;
    }
    
    if (format === 'zip') {
      toast("Preparing ZIP download of " + labelUrls.length + " labels...");
      // In a real implementation, you would create a ZIP file
      setTimeout(() => {
        toast("ZIP download started");
      }, 1500);
    } else {
      // For individual formats, open each label in a new tab
      labelUrls.forEach(url => {
        if (url) {
          window.open(url, '_blank');
        }
      });
      
      toast("Opening " + labelUrls.length + " labels in new tabs");
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    if (!labelUrl) {
      toast("No label URL available");
      return;
    }
    
    // Open the label in a new tab
    window.open(labelUrl, '_blank');
  };

  const handleEmailLabels = async () => {
    const labelUrls = initialResults.processedShipments
      .filter(s => s.label_url)
      .map(s => s.label_url);
    
    if (labelUrls.length === 0) {
      toast("No labels available to email");
      return;
    }
    
    toast("Emailing " + labelUrls.length + " labels to your account...");
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast("Labels have been emailed to your account");
    setShowLabelOptions(false);
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

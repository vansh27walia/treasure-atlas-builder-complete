
import { useState, useCallback } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');

  // Function to remove a shipment
  const handleRemoveShipment = useCallback((shipmentId: string) => {
    if (!results) return;
    
    // Remove the shipment from the list
    const updatedShipments = results.processedShipments.filter(
      (shipment) => shipment.id !== shipmentId
    );
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const rate = shipment.rate || 0;
      // Make sure we're always adding numbers
      return sum + (typeof rate === 'string' ? parseFloat(rate) : rate);
    }, 0);
    
    // Update the results state
    const updatedResults: BulkUploadResult = {
      ...results,
      processedShipments: updatedShipments,
      total: updatedShipments.length,
      successful: updatedShipments.length,
      totalCost,
    };
    
    updateResults(updatedResults);
    
    toast.success('Shipment removed successfully');
  }, [results, updateResults]);
  
  // Function to edit a shipment
  const handleEditShipment = useCallback((shipment: BulkShipment) => {
    // This would typically open a modal or navigate to an edit page
    console.log('Editing shipment:', shipment);
    toast.info('Shipment editing feature coming soon');
  }, []);
  
  // Function to proceed to payment
  const handleProceedToPayment = useCallback(async () => {
    if (!results || results.processedShipments.length === 0) return;
    
    setIsPaying(true);
    try {
      // Validate that all shipments have rates selected
      const unselectedShipments = results.processedShipments.filter(
        (shipment) => !shipment.selectedRateId
      );
      
      if (unselectedShipments.length > 0) {
        toast.error(`${unselectedShipments.length} shipments don't have rates selected`);
        return;
      }
      
      // Simulate API call for payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update shipment statuses to 'processing'
      const updatedShipments = results.processedShipments.map((shipment) => ({
        ...shipment,
        status: 'processing' as const,
      }));
      
      // Update the results state
      const updatedResults: BulkUploadResult = {
        ...results,
        processedShipments: updatedShipments,
        uploadStatus: 'success',
      };
      
      updateResults(updatedResults);
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error('Payment processing failed');
      console.error('Payment error:', error);
    } finally {
      setIsPaying(false);
    }
  }, [results, updateResults]);
  
  // Function to create shipping labels
  const handleCreateLabels = useCallback(async () => {
    if (!results || results.processedShipments.length === 0) return;
    
    setIsCreatingLabels(true);
    try {
      // Simulate API call for label creation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Update shipment statuses to 'completed'
      const updatedShipments = results.processedShipments.map((shipment) => ({
        ...shipment,
        status: 'completed' as const,
        tracking_code: `TRACK-${Math.floor(Math.random() * 1000000)}`,
        label_url: `https://example.com/labels/${shipment.id}.pdf`,
      }));
      
      // Update the results state
      const updatedResults: BulkUploadResult = {
        ...results,
        processedShipments: updatedShipments,
      };
      
      updateResults(updatedResults);
      toast.success('Labels created successfully');
    } catch (error) {
      toast.error('Label creation failed');
      console.error('Label creation error:', error);
    } finally {
      setIsCreatingLabels(false);
    }
  }, [results, updateResults]);
  
  // Function to download all labels
  const handleDownloadAllLabels = useCallback(() => {
    setShowLabelOptions(true);
  }, []);
  
  // Function to download labels in selected format
  const handleDownloadLabelsWithFormat = useCallback((format: 'pdf' | 'png' | 'zpl') => {
    if (!results) return;
    
    setDownloadFormat(format);
    setShowLabelOptions(false);
    
    toast.success(`Downloading labels in ${format.toUpperCase()} format`);
    
    // In a real app, this would trigger an actual download
    console.log(`Downloading all labels in ${format} format`);
  }, [results]);
  
  // Function to download a single label
  const handleDownloadSingleLabel = useCallback((shipmentId: string) => {
    if (!results) return;
    
    const shipment = results.processedShipments.find((s) => s.id === shipmentId);
    if (!shipment || !shipment.label_url) {
      toast.error('Label not available');
      return;
    }
    
    toast.success('Downloading label');
    
    // In a real app, this would trigger an actual download
    console.log(`Downloading label for shipment ${shipmentId}`);
  }, [results]);
  
  // Function to email labels
  const handleEmailLabels = useCallback((email: string) => {
    if (!results) return;
    
    toast.success(`Labels will be emailed to ${email}`);
    setShowLabelOptions(false);
    
    // In a real app, this would send an actual email
    console.log(`Emailing labels to ${email}`);
  }, [results]);

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

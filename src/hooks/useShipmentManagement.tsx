
import { useState } from 'react';
import { toast } from 'sonner';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl' | 'zip'>('pdf');
  
  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(s => s.id !== shipmentId);
    
    // Recalculate total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed');
  };
  
  const handleEditShipment = (shipmentId: string, updatedShipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(s => 
      s.id === shipmentId ? updatedShipment : s
    );
    
    updateResults({
      ...results,
      processedShipments: updatedShipments
    });
    
    toast.success('Shipment updated');
  };
  
  const handleProceedToPayment = async () => {
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsPaying(true);
    
    try {
      // In a real app, you would call your API to process payment
      // Here we'll just simulate an API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update status to success
      updateResults({
        ...results,
        uploadStatus: 'success'
      });
      
      toast.success('Payment processed successfully!');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };
  
  const handleCreateLabels = async () => {
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      // Simulate API delay for label creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create fake label URLs for all shipments
      const updatedShipments = results.processedShipments.map(shipment => {
        if (!shipment.label_url) {
          return { 
            ...shipment,
            label_url: `https://example.com/labels/${shipment.id}.pdf`,
            tracking_code: `TRACK${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          };
        }
        return shipment;
      });
      
      updateResults({
        ...results,
        processedShipments: updatedShipments
      });
      
      toast.success('Labels created successfully!');
    } catch (error) {
      console.error('Label creation error:', error);
      toast.error('Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  const handleDownloadAllLabels = () => {
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error('No labels to download');
      return;
    }
    
    // Open the label options modal
    setShowLabelOptions(true);
  };

  const handlePrintAllLabels = () => {
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error('No labels to print');
      return;
    }
    
    // In real implementation, we would open all labels in a printable format
    // For now, we'll just show a success message
    toast.success('Print preview opened in a new window');
    
    // We could open a single window with all labels
    const allLabels = results.processedShipments
      .filter(s => s.label_url)
      .map(s => s.label_url);
    
    if (allLabels.length > 0) {
      const printWindow = window.open(allLabels[0], '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      }
    }
  };
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results?.processedShipments || results.processedShipments.length === 0) {
      toast.error('No labels to download');
      return;
    }
    
    setDownloadFormat(format);
    setShowLabelOptions(false);
    
    // Here we would normally call an API to get the labels in the selected format
    // For now, we'll just simulate success
    toast.success(`Labels downloaded in ${format.toUpperCase()} format`);
    
    // Simulate download by opening the first label
    const firstLabel = results.processedShipments.find(s => s.label_url);
    if (firstLabel?.label_url) {
      window.open(firstLabel.label_url, '_blank');
    }
  };
  
  const handleDownloadSingleLabel = (labelUrl: string) => {
    if (!labelUrl) {
      toast.error('Label URL not found');
      return;
    }
    
    // Open the label in a new tab
    window.open(labelUrl, '_blank');
    toast.success('Label opened in a new tab');
  };
  
  const handlePrintSingleLabel = (labelUrl: string) => {
    if (!labelUrl) {
      toast.error('Label URL not found');
      return;
    }
    
    // Open the label in a new tab and trigger print
    const printWindow = window.open(labelUrl, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
      toast.success('Print dialog opened in a new tab');
    } else {
      toast.error('Unable to open print window. Check your popup blocker.');
    }
  };
  
  const handleEmailLabels = () => {
    setShowLabelOptions(false);
    
    // Here we would call an API to email the labels
    // For now, just show success message
    toast.success('Labels sent to your email!');
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
    handlePrintAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handlePrintSingleLabel,
    handleEmailLabels,
    setShowLabelOptions,
    setDownloadFormat
  };
};

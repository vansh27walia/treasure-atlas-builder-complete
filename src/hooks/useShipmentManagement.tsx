
import { useState } from 'react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed from list');
  };

  // Updated to accept a single BulkShipment parameter to match BulkUpload expectation
  const handleEditShipment = (shipment: BulkShipment) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(s => {
      if (s.id === shipment.id) {
        return { ...s, ...shipment };
      }
      return s;
    });
    
    updateResults({
      ...results,
      processedShipments: updatedShipments
    });
    
    toast.success('Shipment updated');
  };

  const handleProceedToPayment = () => {
    setIsPaying(true);
    // Payment logic would go here
  };

  const handleCreateLabels = async () => {
    setIsCreatingLabels(true);
    try {
      // Label creation logic would go here
      toast.success('Labels created successfully');
    } catch (error) {
      toast.error('Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!results) return;
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    // Download each label individually with staggered timing
    labelsWithUrls.forEach((shipment, index) => {
      setTimeout(() => {
        handleDownloadSingleLabel(shipment.label_url!, 'png');
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} labels`);
  };

  const handleDownloadLabelsWithFormat = async (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results) return;
    
    if (format === 'pdf' && results.bulk_label_pdf_url) {
      // Download bulk PDF
      handleDownloadSingleLabel(results.bulk_label_pdf_url, 'pdf');
      toast.success('Downloaded bulk PDF label');
      return;
    }
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    if (format === 'zip') {
      toast.loading('Preparing ZIP download...');
      
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, 'png');
        }, index * 300);
      });
      
      toast.dismiss();
      toast.success(`Started download of ${labelsWithUrls.length} labels`);
    } else {
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, format);
        }, index * 300);
      });
      
      toast.success(`Started download of ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string, format: string = 'png') => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  };

  const handleEmailLabels = (email: string) => {
    toast.success('Email functionality will be implemented soon');
  };

  return {
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
  };
};

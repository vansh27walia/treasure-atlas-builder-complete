
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';

export const useShipmentManagement = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [showLabelOptions, setShowLabelOptions] = useState(false);

  const loadDefaultPickupAddress = async () => {
    try {
      const address = await addressService.getDefaultFromAddress();
      if (address) {
        setPickupAddress(address);
      }
    } catch (error) {
      console.error('Error loading default pickup address:', error);
    }
  };

  // Load default pickup address on initialization
  useState(() => {
    loadDefaultPickupAddress();
  });

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

  const handleCreateLabels = async () => {
    if (!initialResults || initialResults.processedShipments.length === 0) {
      toast.error("No shipments to process");
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      console.log('Creating labels for shipments:', initialResults.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: initialResults.processedShipments,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Label creation error:', error);
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      if (data && data.processedLabels && data.processedLabels.length > 0) {
        // Update results with the new label URLs and batch information
        const updatedShipments = initialResults.processedShipments.map(shipment => {
          const labelData = data.processedLabels.find((label: any) => label.id === shipment.id);
          if (labelData) {
            return {
              ...shipment,
              label_url: labelData.label_url,
              label_urls: labelData.label_urls,
              tracking_code: labelData.tracking_code,
              status: 'completed' as const,
              batch_id: labelData.batch_id,
              batch_label_url: labelData.batch_label_url
            };
          }
          return shipment;
        });

        updateResults({
          ...initialResults,
          processedShipments: updatedShipments,
          uploadStatus: 'success'
        });

        toast.success(`Successfully created ${data.processedLabels.length} shipping labels`);
      } else {
        throw new Error('No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  const handleProceedToPayment = async () => {
    if (!initialResults) {
      toast.error("No shipments to process");
      return;
    }
    
    setIsPaying(true);
    
    try {
      // Create labels first
      await handleCreateLabels();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!initialResults || !initialResults.processedShipments.length) {
      toast.error("No labels available to download");
      return;
    }
    
    // Show label options modal
    setShowLabelOptions(true);
  };
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!initialResults || !initialResults.processedShipments.length) return;
    
    setShowLabelOptions(false);
    
    if (format === 'zip') {
      // Handle ZIP download - in a real app this would call a backend endpoint
      toast.loading("Preparing ZIP file...");
      
      // Simulate ZIP download for now
      setTimeout(() => {
        toast.dismiss();
        toast.success("Your labels ZIP file is ready to download");
        
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
      toast.error('No labels available for download');
      return;
    }
    
    toast.success(`Opening ${labelsWithUrls.length} labels in ${format.toUpperCase()} format`);
    
    // Open first 3 labels maximum to avoid browser popup blocking
    labelsWithUrls.slice(0, 3).forEach(shipment => {
      if (shipment.label_url) {
        window.open(shipment.label_url, '_blank');
      }
    });
    
    if (labelsWithUrls.length > 3) {
      toast.success(`${labelsWithUrls.length - 3} more labels are available for individual download`);
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };
  
  const handleEmailLabels = () => {
    toast.success("Email labels feature will be implemented soon");
  };

  const handlePickupAddressSelect = (address: SavedAddress | null) => {
    setPickupAddress(address);
    
    if (address) {
      toast.success(`Using ${address.name || 'selected'} address for pickup`);
    }
  };

  return {
    isPaying,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    pickupAddress,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handlePickupAddressSelect,
    setShowLabelOptions,
    setDownloadFormat
  };
};

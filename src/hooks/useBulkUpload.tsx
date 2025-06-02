
import { useState, useEffect } from 'react';
import { useShipmentUpload } from './useShipmentUpload';
import { useShipmentManagement } from './useShipmentManagement';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useBulkUpload = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange,
    handleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'carrier' | 'rate'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  // Load default pickup address
  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
          setPickupAddress(address);
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultAddress();
  }, []);

  // Filter and sort shipments
  const filteredShipments = results?.processedShipments?.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = !selectedCarrierFilter || 
      shipment.carrier === selectedCarrierFilter;
    
    return matchesSearch && matchesCarrier;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'recipient':
        aValue = a.recipient;
        bValue = b.recipient;
        break;
      case 'carrier':
        aValue = a.carrier;
        bValue = b.carrier;
        break;
      case 'rate':
        aValue = a.rate;
        bValue = b.rate;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        if (selectedRate) {
          return {
            ...shipment,
            selectedRateId: rateId,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            rate: parseFloat(selectedRate.rate)
          };
        }
      }
      return shipment;
    });
    
    // Recalculate total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost
    });
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed from list');
  };

  const handleEditShipment = (shipment: BulkShipment) => {
    console.log('Edit shipment:', shipment);
    // Implement edit functionality if needed
  };

  const handleRefreshRates = async (shipmentId: string) => {
    console.log('Refresh rates for shipment:', shipmentId);
    // Implement rate refresh functionality if needed
  };

  const handleBulkApplyCarrier = (carrier: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      const carrierRate = shipment.availableRates?.find(rate => rate.carrier === carrier);
      if (carrierRate) {
        return {
          ...shipment,
          selectedRateId: carrierRate.id,
          carrier: carrierRate.carrier,
          service: carrierRate.service,
          rate: parseFloat(carrierRate.rate)
        };
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost
    });
    
    toast.success(`Applied ${carrier} to all applicable shipments`);
  };

  const handleProceedToPayment = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
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

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: results.processedShipments,
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

      if (data && data.labels && data.labels.length > 0) {
        // Transform the response to match our expected format
        const updatedShipments = results.processedShipments.map(shipment => {
          const labelData = data.labels.find((label: any) => label.shipment_id === shipment.id);
          if (labelData) {
            return {
              ...shipment,
              label_url: labelData.label_url,
              tracking_code: labelData.tracking_number,
              status: 'completed' as const,
              batch_id: labelData.batch_id,
              // Store additional label data for the success page
              recipient_name: labelData.recipient_name,
              drop_off_address: labelData.drop_off_address,
              tracking_url: labelData.tracking_url
            };
          }
          return shipment;
        });

        const updatedResults = {
          ...results,
          processedShipments: updatedShipments,
          batchId: data.labels[0]?.batch_id,
          bulkLabelUrl: data.bulk_label_url
        };

        setResults(updatedResults);
        setUploadStatus('success');
        toast.success(`Successfully created ${data.labels.length} shipping labels`);
      } else {
        throw new Error('No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
      setUploadStatus('error');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    setShowLabelOptions(true);
  };

  const handleDownloadLabelsWithFormat = async (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results) return;
    
    setShowLabelOptions(false);
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    if (format === 'zip') {
      toast.loading('Preparing ZIP download...');
      
      // Download each label individually with staggered timing
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, 'pdf');
        }, index * 300);
      });
      
      toast.dismiss();
      toast.success(`Started download of ${labelsWithUrls.length} labels`);
    } else {
      // Download each label individually
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, format);
        }, index * 300);
      });
      
      toast.success(`Started download of ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string, format: string = 'pdf') => {
    try {
      // Create download link
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
    // Upload state
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    showLabelOptions,
    
    // Filters and sorting
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    
    // Address
    pickupAddress,
    
    // Setters
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setShowLabelOptions,
    
    // Handlers
    handleFileChange,
    handleUpload,
    handleProceedToPayment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier
  };
};

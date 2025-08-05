
import { useState, useEffect } from 'react';
import { useShipmentUpload } from './useShipmentUpload';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const filteredShipments = results?.processedShipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = !selectedCarrierFilter || 
      shipment.carrier === selectedCarrierFilter;
    
    return matchesSearch && matchesCarrier;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'recipient':
        aValue = a.recipient || '';
        bValue = b.recipient || '';
        break;
      case 'carrier':
        aValue = a.carrier || '';
        bValue = b.carrier || '';
        break;
      case 'rate':
        aValue = a.rate || 0;
        bValue = b.rate || 0;
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
            rate: parseFloat(selectedRate.rate.toString())
          };
        }
      }
      return shipment;
    });
    
    // Recalculate total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
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
      return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed from list');
  };

  const handleEditShipment = (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        return { ...shipment, ...updates };
      }
      return shipment;
    });
    
    setResults({
      ...results,
      processedShipments: updatedShipments
    });
    
    toast.success('Shipment updated');
  };

  const handleRefreshRates = async (shipmentId: string) => {
    console.log('Refresh rates for shipment:', shipmentId);
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
          rate: parseFloat(carrierRate.rate.toString())
        };
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate.toString()) : 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost
    });
    
    toast.success(`Applied ${carrier} to all applicable shipments`);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful, triggering label creation...');
    setIsPaying(false);
    toast.success('Payment successful! Creating labels automatically...');
  };

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: results.processedShipments,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6',
            generateBatch: true
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      if (data.processedLabels && data.processedLabels.length > 0) {
        setResults({
          ...results,
          processedShipments: data.processedLabels,
          batchResult: data.batchResult,
        });

        setUploadStatus('success');
        toast.success(`Successfully created ${data.successful} shipping labels`);

        if (data.failedLabels && data.failedLabels.length > 0) {
          console.error('Failed labels:', data.failedLabels);
          toast.error(`${data.failedLabels.length} labels failed to create. Check console for details.`);
        }
      } else {
        throw new Error(data.message || 'No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
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
        if (shipment.label_url) {
          handleDownloadSingleLabel(shipment.label_url, 'png');
        }
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} labels`);
  };

  const handleDownloadLabelsWithFormat = async (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results) return;
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    labelsWithUrls.forEach((shipment, index) => {
      setTimeout(() => {
        if (shipment.label_url) {
          handleDownloadSingleLabel(shipment.label_url, format);
        }
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
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
    // Upload state
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    
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
    
    // Handlers
    handleFileChange,
    handleUpload,
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
    handleBulkApplyCarrier,
    handlePaymentSuccess
  };
};

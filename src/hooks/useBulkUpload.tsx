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
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  // Add batch print preview modal state
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);
  const [labelGenerationProgress, setLabelGenerationProgress] = useState({
    isGenerating: false,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
    currentStep: '',
    estimatedTimeRemaining: 0
  });

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
    await handleCreateLabels();
  };

  // Direct label creation without modal - goes straight to label creation
  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    setLabelGenerationProgress({
      isGenerating: true,
      totalShipments: results.processedShipments.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      currentStep: 'Initializing...',
      estimatedTimeRemaining: 0
    });
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
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
        // Update results with both individual labels and batch information
        const updatedResults = {
          ...results,
          processedShipments: data.processedLabels,
          batchResult: data.batchResult,
          bulk_label_pdf_url: data.batchResult?.consolidatedLabelUrls?.pdf,
          bulk_label_png_url: data.batchResult?.consolidatedLabelUrls?.png,
        };

        console.log('Updated results with batch info:', {
          batchResult: updatedResults.batchResult,
          bulk_label_pdf_url: updatedResults.bulk_label_pdf_url,
          consolidatedUrls: updatedResults.batchResult?.consolidatedLabelUrls
        });

        setResults(updatedResults);
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
      setLabelGenerationProgress(prev => ({ ...prev, isGenerating: false }));
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

  // Handle opening batch print preview modal
  const handleOpenBatchPrintPreview = () => {
    console.log('Opening batch print preview with:', {
      hasBatchResult: !!results?.batchResult,
      consolidatedUrls: results?.batchResult?.consolidatedLabelUrls,
      bulkPdfUrl: results?.bulk_label_pdf_url
    });
    setBatchPrintPreviewModalOpen(true);
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
    
    // New batch preview state
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    
    // Setters
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    
    // Handlers
    handleFileChange,
    handleUpload,
    handleProceedToPayment,
    handleCreateLabels, // Now goes directly to label creation
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
    handleOpenBatchPrintPreview
  };
};

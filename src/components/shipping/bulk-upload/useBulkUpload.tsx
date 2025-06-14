import { useState, useEffect, useCallback } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult, Rate, SavedAddress, LabelFormat, ShipmentDetails } from '@/types/shipping';
import { useShipmentUpload, UploadStatus as HookUploadStatus } from '@/hooks/useShipmentUpload';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useShipmentManagement, UseShipmentManagementProps } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { addressService } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

export const useBulkUpload = () => {
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [labelGenerationProgress, setLabelGenerationProgress] = useState({
    isGenerating: false,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
    currentStep: '',
    estimatedTimeRemaining: 0
  });
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);
  
  const {
    file,
    isUploading,
    uploadStatus: baseHookUploadStatus, 
    results: baseResults, 
    progress,
    setResults: setBaseResults,
    setUploadStatus: setBaseHookUploadStatus,
    handleFileChange,
    handleUpload: originalHandleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const [results, setResults] = useState<BulkUploadResult | null>(baseResults);

  useEffect(() => {
    setResults(baseResults);
  }, [baseResults]);

  const updateLabelGenerationProgress = useCallback((progressUpdate: Partial<typeof labelGenerationProgress>) => {
    setLabelGenerationProgress(prev => ({ ...prev, ...progressUpdate }));
  }, []);

  const updateResultsCallback = useCallback((newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)) => {
    let finalNewResults: BulkUploadResult | null = null;
    
    setResults(prevLocalResults => {
      const updatedLocal = typeof newResultsData === 'function' ? newResultsData(prevLocalResults) : { ...(prevLocalResults || {} as BulkUploadResult), ...newResultsData };
      finalNewResults = updatedLocal as BulkUploadResult;
      
      // Also update the base results in useShipmentUpload if the source of update is not from there
      // This needs careful handling to avoid loops. For now, only local `results` are updated by this callback.
      // If `useShipmentUpload` needs to be aware, it should have its own setter exposed or this needs rethinking.
      // setBaseResults(finalNewResults); // Potentially problematic if baseResults change triggers useEffect above
      
      return finalNewResults;
    });
    
    // Sync uploadStatus with useShipmentUpload's status
    if (finalNewResults && finalNewResults.uploadStatus && finalNewResults.uploadStatus !== baseHookUploadStatus) {
      const validBaseUploadStatuses: HookUploadStatus[] = ['idle', 'uploading', 'editing', 'creating-labels', 'success', 'error'];
      if (validBaseUploadStatuses.includes(finalNewResults.uploadStatus as HookUploadStatus)) {
        setBaseHookUploadStatus(finalNewResults.uploadStatus as HookUploadStatus);
      } else if (['rates_fetching', 'rate_selection', 'paying'].includes(finalNewResults.uploadStatus)) {
        // Map other statuses to a general 'editing' or similar state if appropriate
        if (!['editing', 'uploading', 'creating-labels'].includes(baseHookUploadStatus)) {
             setBaseHookUploadStatus('editing'); // Or another suitable base status
        }
      }
    }
  }, [baseHookUploadStatus, setBaseHookUploadStatus /* setBaseResults removed to prevent loops for now */]);

  const {
    isFetchingRates,
    handleSelectRate: ratesHookSelectRate,
    handleRefreshRates: originalRefreshRates,
    handleBulkApplyCarrier: originalBulkApplyCarrier
  } = useShippingRates();

  const shipmentManagementProps: UseShipmentManagementProps = {
    initialShipments: results?.processedShipments,
    onUploadComplete: (uploadResultData) => updateResultsCallback({ ...uploadResultData }),
    onRateSelected: (shipmentId, rate) => {
        updateResultsCallback(prev => {
            if (!prev || !prev.processedShipments) return prev;
            return {
                ...prev,
                processedShipments: prev.processedShipments.map(s => 
                    s.id === shipmentId ? { ...s, selectedRateId: rate.id, status: 'rate_selected', rate: rate.rate, carrier: rate.carrier, service: rate.service } : s
                )
            };
        });
    },
    defaultPickupAddress: pickupAddress
  };

  const {
    shipments: managedShipments,
    setShipments: setManagedShipments,
    isLoading: managementIsCreatingLabels,
    error: managementError,
    uploadResult: managementUploadResult,
    processParsedShipments,
    updateShipmentStatus,
    handleRateSelection: managementHandleRateSelection,
    createLabelsForShipments,
    downloadLabel: managementDownloadSingleLabel,
    setCurrentPickupAddress
  } = useShipmentManagement(shipmentManagementProps);

  useEffect(() => {
    if (managedShipments && results?.processedShipments !== managedShipments) {
      updateResultsCallback(prev => ({ ...prev, processedShipments: managedShipments }));
    }
  }, [managedShipments, results?.processedShipments, updateResultsCallback]);
  
  useEffect(() => {
    if (managementError && results?.uploadStatus !== 'error') {
      updateResultsCallback({ uploadStatus: 'error', failed: results?.total || 0, failedShipments: results?.processedShipments?.map(s => ({row: s.row_number, shipmentDetails: s.details, error: managementError})) || [] });
    }
  }, [managementError, results?.total, results?.processedShipments, results?.uploadStatus, updateResultsCallback]);

  useEffect(() => {
    if (managementUploadResult && managementUploadResult !== results) {
      updateResultsCallback(prev => ({...prev, ...managementUploadResult}));
    }
  }, [managementUploadResult, results, updateResultsCallback]);

  const {
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  } = useShipmentFiltering(results);

  useEffect(() => {
    const loadDefaultPickupAddress = async () => {
      try {
        console.log('Loading default pickup address...');
        const defaultAddressFromService = await addressService.getDefaultFromAddress();
        if (defaultAddressFromService) {
          setPickupAddress({ ...defaultAddressFromService, id: String(defaultAddressFromService.id) });
        } else {
          const addressesFromService = await addressService.getSavedAddresses();
          if (addressesFromService.length > 0) {
            const firstAddress = addressesFromService[0];
            setPickupAddress({ ...firstAddress, id: String(firstAddress.id) });
            console.log("Using first available address:", firstAddress);
          } else {
            console.log("No default or saved pickup addresses found.");
          }
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    
    loadDefaultPickupAddress();
  }, []);

  const handleFileUpload = async (fileToUpload: File) => {
    console.log('handleFileUpload in useBulkUpload called with:', { file: fileToUpload.name, currentPickupAddress: pickupAddress });
    
    if (!pickupAddress) {
      const errorMsg = 'Pickup address is required. Please select or add a pickup address first.';
      toast.error(errorMsg);
      setBaseHookUploadStatus('idle');
      throw new Error(errorMsg); 
    }
    
    if (results && (results.processedShipments?.length > 0 || results.batchResult)) {
        updateResultsCallback({ total:0, successful:0, failed:0, processedShipments: [], batchResult: null, uploadStatus: 'idle' });
    }
    
    try {
      await originalHandleUpload(fileToUpload, pickupAddress);
    } catch (error) {
      console.error("Error during originalHandleUpload:", error);
    }
  };

  const handleCreateLabels = async () => {
    if (!results || !results.processedShipments || !pickupAddress) {
      toast.error('Missing shipments data or pickup address.');
      updateLabelGenerationProgress({ isGenerating: false, currentStep: 'Error: Missing data' });
      return;
    }
    const shipmentsToLabel = results.processedShipments.filter(s => s.selectedRateId && s.status === 'rate_selected');
    if (shipmentsToLabel.length === 0) {
        toast.info("No shipments ready for label creation (rates not selected or already processed).");
        updateLabelGenerationProgress({ isGenerating: false });
        return;
    }

    updateLabelGenerationProgress({ 
      isGenerating: true, 
      currentStep: 'Initiating label creation...',
      totalShipments: shipmentsToLabel.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
    });
    try {
      await createLabelsForShipments(shipmentsToLabel, { format: 'pdf' });
    } catch (error: any) {
       toast.error(error.message || "Failed to create labels in main hook");
       updateLabelGenerationProgress({isGenerating: false, currentStep: 'Error during creation'});
    } finally {
        updateLabelGenerationProgress({ isGenerating: false });
    }
  };

  const handleOpenBatchPrintPreview = () => {
    if (results?.batchResult && results.batchResult.batchId) {
      console.log('Opening batch print preview for batch:', results.batchResult.batchId);
      setBatchPrintPreviewModalOpen(true);
    } else if (results?.processedShipments?.some(s => s.label_url || s.label_urls)) {
       console.log('Opening batch print preview for individual labels.');
       setBatchPrintPreviewModalOpen(true);
    }
     else {
      toast.error("No batch results or individual labels available to preview. Please generate labels first.");
      console.warn("Attempted to open batch print preview without batch results or labels:", results);
    }
  };
  
  const setPickupAddressWithStringId = (address: SavedAddress | null) => {
    if (address && typeof address.id === 'number') {
        setPickupAddress({ ...address, id: String(address.id) });
    } else {
        setPickupAddress(address);
    }
  };

  const handleRemoveShipment = (shipmentId: string) => {
    console.warn("handleRemoveShipment not implemented with current useShipmentManagement");
    toast.info("Removing shipments is not currently supported here.");
  };
  const handleEditShipment = (shipmentId: string, details: Partial<ShipmentDetails>) => {
     console.warn("handleEditShipment not implemented with current useShipmentManagement");
     toast.info("Editing shipments is not currently supported here.");
  };
  const handleDownloadLabelsWithFormat = (format: LabelFormat, type: 'batch' | 'pickup_manifest', contentUrl?: string) => {
    console.warn("handleDownloadLabelsWithFormat not implemented with current useShipmentManagement");
    if (type === 'batch' && contentUrl) {
        managementDownloadSingleLabel(contentUrl, `${type}_labels.${format}`);
    } else {
        toast.info(`Downloading all ${type} labels in ${format} not fully supported yet.`);
    }
  };
  const handleEmailLabels = (shipmentIds: string[], email: string) => {
    console.warn("handleEmailLabels not implemented");
    toast.info("Emailing labels is not currently supported.");
  };

  return {
    file,
    isUploading,
    uploadStatus: baseHookUploadStatus,
    results,
    progress,
    isFetchingRates,
    isCreatingLabels: managementIsCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress: setPickupAddressWithStringId,
    handleFileChange,
    handleUpload: handleFileUpload,
    handleSelectRate: ratesHookSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates: originalRefreshRates,
    handleBulkApplyCarrier: originalBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel: managementDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress,
    updateLabelGenerationProgress
  };
};


import { useState, useEffect, useCallback } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult, Rate, SavedAddress, LabelFormat, ShipmentDetails } from '@/types/shipping';
import { useShipmentUpload, UploadStatus as HookUploadStatus } from '@/hooks/useShipmentUpload'; // Renamed to avoid conflict if any
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { addressService } from '@/services/AddressService';
// import { supabase } from '@/integrations/supabase/client'; // Not used directly here
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
    handleUpload: originalHandleUpload, // This is (file, pickupAddress) from useShipmentUpload
    handleDownloadTemplate
  } = useShipmentUpload();

  const [results, setResults] = useState<BulkUploadResult | null>(baseResults);

  useEffect(() => {
    setResults(baseResults);
  }, [baseResults]);

  const updateLabelGenerationProgress = useCallback((progressUpdate: Partial<typeof labelGenerationProgress>) => {
    setLabelGenerationProgress(prev => ({ ...prev, ...progressUpdate }));
  }, []);

  const updateResults = useCallback((newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)) => {
    let finalNewResults: BulkUploadResult | null = null;
    
    setResults(prev => {
      const updated = typeof newResultsData === 'function' ? newResultsData(prev) : { ...(prev || {} as BulkUploadResult), ...newResultsData };
      finalNewResults = updated as BulkUploadResult;
      
      if (typeof newResultsData !== 'function') {
          setBaseResults(finalNewResults);
      }
      return finalNewResults;
    });
    
    if (finalNewResults && finalNewResults.uploadStatus && finalNewResults.uploadStatus !== baseHookUploadStatus) {
      const validBaseUploadStatuses: HookUploadStatus[] = ['idle', 'uploading', 'editing', 'creating-labels', 'success', 'error'];
      if (validBaseUploadStatuses.includes(finalNewResults.uploadStatus as HookUploadStatus)) {
        setBaseHookUploadStatus(finalNewResults.uploadStatus as HookUploadStatus);
      } else if (['rates_fetching', 'rate_selection', 'paying'].includes(finalNewResults.uploadStatus)) {
        if (!['editing', 'uploading', 'creating-labels'].includes(baseHookUploadStatus)) {
             setBaseHookUploadStatus('editing');
        }
      }
    }
  }, [baseHookUploadStatus, setBaseResults, setBaseHookUploadStatus]);

  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate: originalSelectRate,
    handleRefreshRates: originalRefreshRates,
    handleBulkApplyCarrier: originalBulkApplyCarrier
  } = useShipmentRates(results, updateResults, pickupAddress); // Pass pickupAddress

  const {
    isPaying,
    isCreatingLabels: managementIsCreatingLabels,
    handleRemoveShipment: originalRemoveShipment,
    handleEditShipment: originalEditShipment,
    handleCreateLabels: managementCreateLabels,
    handleDownloadLabelsWithFormat: originalDownloadFormat,
    handleDownloadSingleLabel: originalDownloadSingle,
    handleEmailLabels: originalEmailLabels
  } = useShipmentManagement(results, updateResults, pickupAddress);

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
          // TS2345: Ensure id is string
          setPickupAddress({ ...defaultAddressFromService, id: String(defaultAddressFromService.id) });
        } else {
          const addressesFromService = await addressService.getSavedAddresses();
          if (addressesFromService.length > 0) {
            const firstAddress = addressesFromService[0];
            // TS2345: Ensure id is string
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

  // This function is what's EXPORTED as `handleUpload`
  const handleFileUpload = async (fileToUpload: File) => { // Takes 1 argument: File
    console.log('handleFileUpload in useBulkUpload called with:', { file: fileToUpload.name, currentPickupAddress: pickupAddress });
    
    if (!pickupAddress) {
      const errorMsg = 'Pickup address is required. Please select or add a pickup address first.';
      toast.error(errorMsg, { /* ... */ });
      setBaseHookUploadStatus('idle');
      throw new Error(errorMsg); 
    }
    
    if (results && (results.processedShipments?.length > 0 || results.batchResult)) {
        updateResults({ total:0, successful:0, failed:0, processedShipments: [], batchResult: null, uploadStatus: 'idle' });
    }
    
    try {
      // TS2554: Expected 2 arguments, but got 3. (This error was on this line)
      // originalHandleUpload takes (file, pickupAddress). The call is correct with 2 args.
      // The error might be due to type inference on originalHandleUpload itself.
      // Let's ensure originalHandleUpload is correctly typed from useShipmentUpload.
      await originalHandleUpload(fileToUpload, pickupAddress);
    } catch (error) {
      console.error("Error during originalHandleUpload:", error);
      // Error handling
    }
  };

  const handleCreateLabels = async () => {
    // ... (implementation as before) ...
    if (!results || !pickupAddress) {
      toast.error('Missing shipments data or pickup address.');
      updateLabelGenerationProgress({ isGenerating: false, currentStep: 'Error: Missing data' });
      return;
    }
    updateLabelGenerationProgress({ 
      isGenerating: true, 
      currentStep: 'Initiating label creation...',
      totalShipments: results.processedShipments.filter(s => s.selectedRateId).length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
    });
    try {
      await managementCreateLabels(); 
    } catch (error: any) {
       toast.error(error.message || "Failed to create labels in main hook");
       updateLabelGenerationProgress({isGenerating: false, currentStep: 'Error during creation'});
    }
  };

  const handleOpenBatchPrintPreview = () => {
    // ... (implementation as before) ...
     if (results?.batchResult && results.batchResult.batchId) {
      console.log('Opening batch print preview for batch:', results.batchResult.batchId);
      setBatchPrintPreviewModalOpen(true);
    } else {
      toast.error("No batch results available to preview. Please generate labels first.");
      console.warn("Attempted to open batch print preview without batch results:", results);
    }
  };
  
  const setPickupAddressWithStringId = (address: SavedAddress | null) => {
    if (address && typeof address.id === 'number') {
        setPickupAddress({ ...address, id: String(address.id) });
    } else {
        setPickupAddress(address);
    }
  };


  return {
    file,
    isUploading,
    uploadStatus: baseHookUploadStatus,
    results,
    progress,
    isFetchingRates,
    isPaying,
    isCreatingLabels: managementIsCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress: setPickupAddressWithStringId, // Use wrapper to ensure string ID
    handleFileChange,
    handleUpload: handleFileUpload, // Export the 1-arg version
    handleSelectRate: originalSelectRate,
    handleRemoveShipment: originalRemoveShipment,
    handleEditShipment: originalEditShipment, // This is (shipmentId, details) from useShipmentManagement
    handleRefreshRates: originalRefreshRates,
    handleBulkApplyCarrier: originalBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadLabelsWithFormat: originalDownloadFormat,
    handleDownloadSingleLabel: originalDownloadSingle,
    handleEmailLabels: originalEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress,
    updateLabelGenerationProgress
  };
};

import { useState, useEffect } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult, Rate, SavedAddress, LabelFormat, ShipmentDetails } from '@/types/shipping';
import { useShipmentUpload, UploadStatus as BaseUploadStatus } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { addressService } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
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

  const updateResults = (newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)) => {
    let finalNewResults: BulkUploadResult | null = null;
    
    setResults(prev => {
      const updated = typeof newResultsData === 'function' ? newResultsData(prev) : { ...(prev || {} as BulkUploadResult), ...newResultsData };
      finalNewResults = updated as BulkUploadResult; // Cast here for properties check
      
      // Also update the base hook's results if it's a full replacement
      // This might be tricky if newResultsData is partial.
      // For simplicity, assume updateResults always provides a "fuller" picture.
      if (typeof newResultsData !== 'function') {
          setBaseResults(finalNewResults);
      }
      return finalNewResults;
    });
    
    if (finalNewResults && finalNewResults.uploadStatus && finalNewResults.uploadStatus !== baseHookUploadStatus) {
      const validBaseUploadStatuses: BaseUploadStatus[] = ['idle', 'uploading', 'editing', 'creating-labels', 'success', 'error'];
      if (validBaseUploadStatuses.includes(finalNewResults.uploadStatus as BaseUploadStatus)) {
        setBaseHookUploadStatus(finalNewResults.uploadStatus as BaseUploadStatus);
      } else if (['rates_fetching', 'rate_selection', 'paying'].includes(finalNewResults.uploadStatus)) {
        if (baseHookUploadStatus !== 'editing' && baseHookUploadStatus !== 'uploading' && baseHookUploadStatus !== 'creating-labels') {
          setBaseHookUploadStatus('editing');
        }
      }
    }
  };

  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate: originalSelectRate,
    handleRefreshRates: originalRefreshRates,
    handleBulkApplyCarrier: originalBulkApplyCarrier
  } = useShipmentRates(results, updateResults);

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
        const defaultAddress = await addressService.getDefaultFromAddress();
        console.log("Loaded default pickup address:", defaultAddress);
        if (defaultAddress) {
          setPickupAddress(defaultAddress);
        } else {
          const addresses = await addressService.getSavedAddresses();
          if (addresses.length > 0) {
            const firstAddress = addresses[0];
            setPickupAddress(firstAddress);
            console.log("Using first available address:", firstAddress);
          } else {
            console.log("No default or saved pickup addresses found.");
          }
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
        // toast.error('Error loading pickup addresses. Please check your settings.'); // Consider if toast is too aggressive here
      }
    };
    
    loadDefaultPickupAddress();
  }, []);

  const handleFileUpload = async (fileToUpload: File) => {
    console.log('handleFileUpload in components/useBulkUpload called with:', { file: fileToUpload.name, currentPickupAddress: pickupAddress });
    
    if (!pickupAddress) {
      const errorMsg = 'Pickup address is required. Please select or add a pickup address first.';
      toast.error(errorMsg, {
        description: 'You can manage pickup addresses in Settings.',
        action: {
          label: 'Go to Settings',
          onClick: () => {
            // Assuming you have a router or a way to navigate
            // This might need to be adapted to your specific routing setup
            window.location.href = '/settings'; 
          }
        }
      });
      // To prevent upload from proceeding, we need to stop here.
      // originalHandleUpload expects a Promise.
      // We can throw an error or return a rejected promise.
      setBaseHookUploadStatus('idle'); // Reset status
      throw new Error(errorMsg); 
    }
    
    if (results && (results.processedShipments?.length > 0 || results.batchResult)) {
        updateResults({ total:0, successful:0, failed:0, processedShipments: [], batchResult: null, uploadStatus: 'idle' });
        // Reset other relevant states
    }
    
    try {
      await originalHandleUpload(fileToUpload, pickupAddress);
      // results will be updated via baseResults -> useEffect sync
    } catch (error) {
      // Error is already toasted in originalHandleUpload.
      // Ensure uploadStatus is 'error' or 'idle'.
      // baseHookUploadStatus should already be 'error' from originalHandleUpload.
      console.error("Error during originalHandleUpload:", error);
      // updateResults might not be necessary if baseHook already set status to error
      // and results to null or an error state.
    }
  };

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments data or pickup address.');
      return;
    }
    // Any pre-checks specific to this high-level hook
    // Then call the management hook's function
    setLabelGenerationProgress(prev => ({...prev, isGenerating: true, currentStep: 'Initiating...'}));
    try {
      await managementCreateLabels(); // This will update results and its own progress via updateResults
    } catch (error: any) {
       toast.error(error.message || "Failed to create labels in main hook");
       setLabelGenerationProgress(prev => ({...prev, isGenerating: false, currentStep: 'Error'}));
    } finally {
       // The managementCreateLabels should set isGenerating to false eventually
       // or updateResults will set the overall status.
    }
  };

  const handleOpenBatchPrintPreview = () => {
    if (results?.batchResult && results.batchResult.batchId) {
      console.log('Opening batch print preview for batch:', results.batchResult.batchId);
      setBatchPrintPreviewModalOpen(true);
    } else {
      toast.error("No batch results available to preview. Please generate labels first.");
      console.warn("Attempted to open batch print preview without batch results:", results);
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
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
    handleFileChange,
    handleUpload: handleFileUpload,
    handleSelectRate: originalSelectRate,
    handleRemoveShipment: originalRemoveShipment,
    handleEditShipment: originalEditShipment,
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
    labelGenerationProgress
  };
};

import { useState, useEffect } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult, Rate } from '@/types/shipping';
import { useShipmentUpload, UploadStatus as BaseUploadStatus } from '@/hooks/useShipmentUpload'; // Renamed to avoid conflict
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { SavedAddress } from '@/services/AddressService';
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
    uploadStatus: baseHookUploadStatus, // Renamed to avoid conflict with results.uploadStatus
    results,
    progress,
    setResults,
    setUploadStatus: setBaseHookUploadStatus, // Renamed
    handleFileChange,
    handleUpload: originalHandleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const updateResults = (newResults: BulkUploadResult) => {
    console.log('Updating results in useBulkUpload:', newResults);
    setResults(newResults);
    
    // Type for statuses accepted by useShipmentUpload's setUploadStatus
    const validBaseUploadStatuses: BaseUploadStatus[] = ['idle', 'uploading', 'editing', 'creating-labels', 'success', 'error'];

    if (newResults.uploadStatus && newResults.uploadStatus !== baseHookUploadStatus) {
      if (validBaseUploadStatuses.includes(newResults.uploadStatus as BaseUploadStatus)) {
        setBaseHookUploadStatus(newResults.uploadStatus as BaseUploadStatus);
      } else if (['rates_fetching', 'rate_selection', 'paying'].includes(newResults.uploadStatus)) {
        // Map granular processing statuses to 'editing' for the base hook,
        // if not already in a general processing state.
        if (baseHookUploadStatus !== 'editing' && baseHookUploadStatus !== 'uploading') {
          setBaseHookUploadStatus('editing');
        }
      } else {
        // This case should ideally not be reached if types are well-defined.
        console.warn(`Unhandled uploadStatus from BulkUploadResult: ${newResults.uploadStatus} when updating base upload status.`);
      }
    }
  };

  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier
  } = useShipmentRates(results, updateResults);

  const {
    isPaying, // This might be from useShipmentManagement, ensure it's correctly used
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    // handleProceedToPayment, // Check if this is still needed/used
    handleCreateLabels: originalHandleCreateLabels,
    // handleDownloadAllLabels, // Removed
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels
  } = useShipmentManagement(results, updateResults, pickupAddress); // Pass pickupAddress if needed by management hook

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

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments data or pickup address. Cannot create labels.');
      console.error('Attempted to create labels with missing results or pickupAddress:', { results, pickupAddress });
      return;
    }
    
    let shipmentsArray: BulkShipment[] = [];
    if (Array.isArray(results.processedShipments)) {
      shipmentsArray = results.processedShipments;
    } else if (results.processedShipments && typeof results.processedShipments === 'object') {
      // This case might occur if processedShipments is an object map. Filter out null/undefined.
      shipmentsArray = Object.values(results.processedShipments).filter(Boolean) as BulkShipment[];
    }
    
    const shipmentsToProcess = shipmentsArray.filter(s => s.selectedRateId && s.easypost_id && s.status !== 'failed' && s.status !== 'error') || [];
    
    if (shipmentsToProcess.length === 0) {
      toast.error('No shipments with selected rates are ready for label creation.');
      console.error('No shipments to process for label creation:', shipmentsArray);
      return;
    }

    const totalShipmentsWithDetails = shipmentsArray.length; // Total shipments that went through rate fetching
    const shipmentsWithRatesSelected = shipmentsToProcess.length;
    
    // Validate that ALL shipments that *could* have rates selected *do* have rates selected.
    // This logic might need refinement based on whether partial batch creation is allowed.
    // For now, assume all must have rates.
    const shipmentsThatShouldHaveRates = shipmentsArray.filter(s => s.status !== 'failed' && s.status !== 'error');

    if (shipmentsWithRatesSelected !== shipmentsThatShouldHaveRates.length) {
      const missingRatesCount = shipmentsThatShouldHaveRates.length - shipmentsWithRatesSelected;
      toast.error(`${missingRatesCount} shipment(s) are missing rate selections. ALL eligible shipments must have rates selected before creating labels.`);
      console.error(`Rate validation failed: ${shipmentsWithRatesSelected}/${shipmentsThatShouldHaveRates.length} eligible shipments have rates selected`);
      return;
    }
    
    console.log(`✅ Validation passed: Creating labels for ${shipmentsToProcess.length} shipments with rates selected.`);
    
    setLabelGenerationProgress({
      isGenerating: true,
      totalShipments: shipmentsToProcess.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      currentStep: 'Starting label generation...',
      estimatedTimeRemaining: shipmentsToProcess.length * 8 // Rough estimate
    });
    
    try {
      setBaseHookUploadStatus('creating-labels'); // Use the renamed setter
      
      let estimatedTimeRemaining = shipmentsToProcess.length * 8;
      const progressInterval = setInterval(() => {
        estimatedTimeRemaining = Math.max(0, estimatedTimeRemaining - 1);
        setLabelGenerationProgress(prev => ({
          ...prev,
          estimatedTimeRemaining
        }));
      }, 1000);

      // Using 'create-enhanced-bulk-labels' based on previous context
      const { data, error: functionError } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: shipmentsToProcess.map(s => ({ // Send only necessary data
            easypost_shipment_id: s.easypost_id,
            selected_rate_id: s.selectedRateId,
            original_shipment_id: s.id, // To map results back
            row: s.row, // For error reporting
          })),
          pickupAddressId: pickupAddress.id, // Send ID, backend can fetch full address
          labelOptions: { 
            generateBatch: true,
            generateManifest: true, // EasyPost Scan Form
            preferredIndividualFormat: 'pdf', // Request PDF for individual if possible
          }
        }
      });

      clearInterval(progressInterval);

      if (functionError) {
        console.error('Label creation error from Supabase function:', functionError);
        throw new Error(functionError.message || 'Unknown error from label generation function.');
      }

      console.log('Raw label creation response from create-enhanced-bulk-labels:', data);

      if (data && data.processedShipments && Array.isArray(data.processedShipments)) {
        const backendProcessedShipments: BulkShipment[] = data.processedShipments;
        const backendFailedShipmentsInfo: any[] = data.failedShipmentsInfo || [];
        
        const successfulCount = backendProcessedShipments.filter(s => s.status === 'completed' || s.status === 'label_purchased').length;
        const failedCount = backendFailedShipmentsInfo.length + backendProcessedShipments.filter(s => s.status === 'failed' || s.status === 'error').length;

        setLabelGenerationProgress({
          isGenerating: false,
          totalShipments: shipmentsToProcess.length,
          processedShipments: shipmentsToProcess.length, 
          successfulShipments: successfulCount,
          failedShipments: failedCount,
          currentStep: 'Label generation complete!',
          estimatedTimeRemaining: 0
        });
        
        // Merge backend results with existing frontend shipment data
        const finalProcessedShipments = results.processedShipments.map(existingShipment => {
            const foundProcessed = backendProcessedShipments.find(bp => bp.id === existingShipment.id || bp.original_shipment_id === existingShipment.id);
            if (foundProcessed) {
                return {
                    ...existingShipment,
                    ...foundProcessed, // Overwrite with new data from backend
                    status: foundProcessed.status || 'completed', // Ensure status is correctly set
                };
            }
            // Check if it's in failed shipments from backend (if backend returns full failed shipment objects)
            const foundFailed = backendFailedShipmentsInfo.find(bf => bf.shipmentId === existingShipment.id);
             if (foundFailed) {
                return {
                    ...existingShipment,
                    status: 'failed' as const,
                    error: foundFailed.error || 'Label creation failed on backend',
                };
            }
            return existingShipment; // Keep as is if not updated
        });


        let frontendBatchResult: BatchResult | null = null;
        if (data.batchResult && data.batchResult.batchId) {
            frontendBatchResult = {
                batchId: data.batchResult.batchId,
                consolidatedLabelUrls: {
                    pdf: data.batchResult.consolidatedLabelUrls?.pdf,
                    zpl: data.batchResult.consolidatedLabelUrls?.zpl,
                    epl: data.batchResult.consolidatedLabelUrls?.epl,
                    pdfZip: data.batchResult.consolidatedLabelUrls?.pdfZip,
                    zplZip: data.batchResult.consolidatedLabelUrls?.zplZip,
                    eplZip: data.batchResult.consolidatedLabelUrls?.eplZip,
                },
                scanFormUrl: data.batchResult.scanFormUrl || null,
            };
        }

        const updatedResultsData: BulkUploadResult = {
          ...results, // Preserve existing parts of results
          total: shipmentsToProcess.length,
          successful: successfulCount,
          failed: failedCount,
          totalCost: finalProcessedShipments.reduce((sum, s) => sum + (s.rate || 0), 0), // Recalculate cost
          processedShipments: finalProcessedShipments,
          failedShipments: backendFailedShipmentsInfo.map(f => ({ 
              shipmentId: f.shipmentId, 
              error: f.error, 
              row: shipmentsToProcess.find(s => s.id === f.shipmentId || s.easypost_id === f.shipmentId)?.row,
              details: f.details,
            })),
          batchResult: frontendBatchResult,
          uploadStatus: 'success' as const, // Overall status
          pickupAddress
        };

        console.log(`✅ Label creation results: ${updatedResultsData.successful} successful, ${updatedResultsData.failed} failed.`);
        updateResults(updatedResultsData); // This will call setResults and setBaseHookUploadStatus
        
        if (updatedResultsData.successful === shipmentsToProcess.length && shipmentsToProcess.length > 0) {
          toast.success(`🎉 ALL ${updatedResultsData.successful} shipping labels generated!`);
        } else if (updatedResultsData.successful > 0) {
          toast.warning(`⚠️ ${updatedResultsData.successful} out of ${shipmentsToProcess.length} labels created. ${updatedResultsData.failed} failed.`);
        } else if (shipmentsToProcess.length > 0) {
           toast.error(`❌ All ${shipmentsToProcess.length} label creations failed. Check details.`);
        }

        if (frontendBatchResult?.batchId) {
          toast.success(`✅ Batch ${frontendBatchResult.batchId} outputs generated.`);
          if (frontendBatchResult.scanFormUrl) {
            toast.info(`🧾 Scan Form available for batch ${frontendBatchResult.batchId}.`);
          }
        }
        if (updatedResultsData.failed > 0) {
          toast.error(`${updatedResultsData.failed} labels failed to create. Review the shipments list for details.`);
        }

      } else {
        console.error('Invalid response format or no labels processed by backend:', data);
        throw new Error(data?.error || 'No labels were processed or invalid response format from backend.');
      }

    } catch (error: any) {
      console.error('Error creating labels in useBulkUpload:', error);
      setLabelGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        currentStep: 'Label generation failed.',
        failedShipments: prev.failedShipments + (prev.totalShipments - prev.successfulShipments - prev.failedShipments) // Assume remaining are failed
      }));
      toast.error(error.message || 'Failed to create labels due to an unexpected error.');
      updateResults({ ...results, uploadStatus: 'error' } as BulkUploadResult); // Ensure results is not undefined
    }
  };

  const handleFileUpload = async (fileToUpload: File) => {
    console.log('handleFileUpload called with:', { file: fileToUpload.name, pickupAddress });
    
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
    
    // Ensure results are reset for a new upload if it's not the initial one
    if (results && (results.processedShipments?.length > 0 || results.batchResult)) {
        setResults({ total:0, successful:0, failed:0, processedShipments: [] }); // Reset results
        setLabelGenerationProgress({ isGenerating: false, totalShipments: 0, processedShipments: 0, successfulShipments: 0, failedShipments: 0, currentStep: '', estimatedTimeRemaining: 0 });
        setBatchPrintPreviewModalOpen(false);
    }
    
    return originalHandleUpload(fileToUpload, pickupAddress);
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
    uploadStatus: baseHookUploadStatus, // Expose the base hook's status
    results,
    progress,
    isFetchingRates,
    isPaying, // from useShipmentManagement
    isCreatingLabels, // from useShipmentManagement
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress, // Make sure this is correctly updating the state used by handleFileUpload
    handleFileChange,
    handleUpload: handleFileUpload, // Use the wrapped version
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress
  };
};

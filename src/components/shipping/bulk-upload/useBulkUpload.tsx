
import React, { useState, useEffect, useCallback } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult, UploadStatus, SavedAddress, Rate } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
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
    isUploading: isParsingFile, 
    uploadStatus: parsingStatus,
    results: initialParsedResults, 
    progress: parsingProgress,
    setResults: setInitialParsedResults, // Allow useShipmentUpload to update its internal results
    handleFileChange,
    handleUpload: originalHandleUpload, 
    handleDownloadTemplate 
  } = useShipmentUpload();

  const [currentResults, setCurrentResults] = useState<BulkUploadResult | null>(null);
  const [overallUploadStatus, setOverallUploadStatus] = useState<UploadStatus>('idle');

  const updateCurrentResultsAndStatus = useCallback((newResults: BulkUploadResult, newStatus?: UploadStatus) => {
    console.log('Updating currentResults in useBulkUpload:', newResults, 'New status:', newStatus);
    setCurrentResults(prev => ({ ...prev, ...newResults })); // Merge to preserve parts of results not updated
    
    const statusToSet = newStatus || newResults.uploadStatus || overallUploadStatus;
    if (statusToSet !== overallUploadStatus) {
      const validStatuses: UploadStatus[] = ['idle', 'uploading', 'processing', 'editing', 'success', 'error', 'creating-labels'];
      if (validStatuses.includes(statusToSet)) {
        setOverallUploadStatus(statusToSet);
      } else {
        console.warn(`Received non-standard uploadStatus: ${statusToSet}. Global status remains ${overallUploadStatus}.`);
      }
    }
  }, [overallUploadStatus]);


  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate: managedSelectRate,
    handleRefreshRates: managedRefreshRates,
    handleBulkApplyCarrier: managedBulkApplyCarrier
  } = useShipmentRates(currentResults, updateCurrentResultsAndStatus);
  
  // Effect to handle results from initial file parsing (useShipmentUpload)
  useEffect(() => {
    if (parsingStatus === 'success' && initialParsedResults) {
      console.log("File parsing successful, initial results:", initialParsedResults);
      // Update main results and status
      updateCurrentResultsAndStatus({
        ...initialParsedResults, // Spread parsed results
        batchResult: null, // Ensure batchResult is reset
        uploadStatus: 'processing', // Transition to server-side processing (fetching rates)
        isFetchingRates: true, // Indicate rate fetching is starting
      }, 'processing');

      if (initialParsedResults.processedShipments && initialParsedResults.processedShipments.length > 0 && pickupAddress) {
        fetchAllShipmentRates(initialParsedResults.processedShipments, pickupAddress);
      } else if (!pickupAddress) {
          toast.error("Pickup address not set. Cannot fetch rates.");
          updateCurrentResultsAndStatus({ ...initialParsedResults, uploadStatus: 'error', isFetchingRates: false }, 'error');
      }
      // Reset parsing status to avoid re-triggering
      // setParsingStatus('idle'); // Or let useShipmentUpload manage its own cycle
    } else if (parsingStatus === 'error') {
        updateCurrentResultsAndStatus({
            total:0, successful:0, failed:0, processedShipments:[], 
            failedShipments: [{error: "File parsing failed."}],
            uploadStatus: 'error', isFetchingRates: false
        }, 'error');
    }
  }, [parsingStatus, initialParsedResults, pickupAddress, fetchAllShipmentRates, updateCurrentResultsAndStatus]);


  const {
    isPaying,
    handleRemoveShipment: managedRemoveShipment,
    handleEditShipment: managedEditShipment,
    handleDownloadAllLabels, 
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels
  } = useShipmentManagement(currentResults, updateCurrentResultsAndStatus);

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
  } = useShipmentFiltering(currentResults);

  useEffect(() => {
    const loadDefaultPickupAddress = async () => {
      try {
        const defaultAddress = await addressService.getDefaultFromAddress();
        if (defaultAddress) {
          setPickupAddress(defaultAddress);
        } else {
          const addresses = await addressService.getSavedAddresses();
          if (addresses.length > 0) {
            setPickupAddress(addresses[0]);
          } else {
            toast.warn("No saved pickup addresses found. Please add one in settings for bulk uploads.");
          }
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultPickupAddress();
  }, []);

  const handleFullUploadProcess = async (fileToUpload: File) => {
    if (!pickupAddress) {
      toast.error('Pickup address is required. Please select or add a pickup address first.', {
         action: { label: 'Go to Settings', onClick: () => window.location.href = '/settings' }
      });
      setOverallUploadStatus('idle');
      return;
    }
    // Reset states for a new upload
    setCurrentResults(null); 
    setLabelGenerationProgress(p => ({...p, isGenerating:false, totalShipments:0, currentStep: ''}));
    setOverallUploadStatus('uploading'); // Client-side parsing starts

    // originalHandleUpload from useShipmentUpload parses the file
    // and updates `initialParsedResults` and `parsingStatus`
    // The useEffect listening to `parsingStatus` will then trigger rate fetching.
    await originalHandleUpload(fileToUpload, pickupAddress); 
  };

  const handleCreateLabels = async () => {
    if (!currentResults || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    const shipmentsToProcess = (currentResults.processedShipments || []).filter(s => s.selectedRateId && s.easypost_id);
    if (shipmentsToProcess.length === 0) {
      toast.error('No shipments ready for label creation (missing selected rate or EasyPost ID).');
      return;
    }
    if (shipmentsToProcess.length !== currentResults.processedShipments.length) {
        toast.warn(`Only ${shipmentsToProcess.length} out of ${currentResults.processedShipments.length} shipments are ready for label creation.`);
    }

    setLabelGenerationProgress({
      isGenerating: true, totalShipments: shipmentsToProcess.length, processedShipments: 0,
      successfulShipments: 0, failedShipments: 0, currentStep: 'Starting label generation...',
      estimatedTimeRemaining: shipmentsToProcess.length * 5 // Rough estimate
    });
    updateCurrentResultsAndStatus({ ...currentResults, uploadStatus: 'creating-labels' }, 'creating-labels');
    
    try {
      const timer = setInterval(() => setLabelGenerationProgress(p => ({...p, estimatedTimeRemaining: Math.max(0,p.estimatedTimeRemaining-1)})), 1000);
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: { shipments: shipmentsToProcess, pickupAddress, labelOptions: { generateBatch: true, generateManifest: true } }
      });
      clearInterval(timer);

      if (error) throw new Error(error.message || 'Label generation function failed.');
      if (!data || !Array.isArray(data.processedLabels)) throw new Error('Invalid response from label generation function.');

      const successfulLabelData = data.processedLabels.filter((l: any) => l.status === 'completed' || l.status?.includes('success'));
      const failedLabelData = data.failedLabels || data.processedLabels.filter((l: any) => l.status === 'failed' || l.status?.includes('error'));

      setLabelGenerationProgress(prev => ({
        ...prev, isGenerating: false, processedShipments: shipmentsToProcess.length,
        successfulShipments: successfulLabelData.length, failedShipments: failedLabelData.length,
        currentStep: 'Label generation complete!'
      }));

      const updatedShipments = (currentResults.processedShipments || []).map(origShip => {
        const successfulMatch = successfulLabelData.find((s: any) => s.original_shipment_id === origShip.id || s.id === origShip.easypost_id);
        if (successfulMatch) {
          return {
            ...origShip,
            easypost_id: successfulMatch.id || origShip.easypost_id,
            tracking_code: successfulMatch.tracking_code,
            tracking_number: successfulMatch.tracking_code,
            label_url: successfulMatch.label_urls?.png || successfulMatch.label_url,
            label_urls: successfulMatch.label_urls || { png: successfulMatch.label_url, pdf: successfulMatch.label_urls?.pdf },
            status: 'completed' as const,
            rate: parseFloat(successfulMatch.rate) || origShip.rate,
          };
        }
        const failedMatch = failedLabelData.find((f: any) => f.shipmentId === origShip.id || f.shipmentId === origShip.easypost_id);
        if (failedMatch) {
          return { ...origShip, status: 'failed' as const, details: failedMatch.error };
        }
        return origShip;
      });
      
      const newBatchResult: BatchResult | null = data.batchResult?.batchId ? {
        batchId: data.batchResult.batchId,
        consolidatedLabelUrls: data.batchResult.batchLabelUrls || {},
        scanFormUrl: data.batchResult.scanFormUrl || null,
        status: data.batchResult.status,
        labelCount: data.batchResult.num_shipments,
      } : null;

      updateCurrentResultsAndStatus({
        ...currentResults,
        processedShipments: updatedShipments,
        successful: successfulLabelData.length,
        failed: failedLabelData.length,
        totalCost: updatedShipments.filter(s=>s.status==='completed').reduce((sum, s) => sum + (s.rate || 0), 0),
        batchResult: newBatchResult,
        uploadStatus: 'success',
        isFetchingRates: false,
      }, 'success');

      if (successfulLabelData.length > 0) toast.success(`🎉 ${successfulLabelData.length} labels generated!`);
      if (failedLabelData.length > 0) toast.error(`⚠️ ${failedLabelData.length} labels failed.`);
      if (newBatchResult?.scanFormUrl) toast.success('✅ Scan Form (Manifest) available!');

    } catch (err) {
      console.error('Error creating labels:', err);
      setLabelGenerationProgress(p => ({ ...p, isGenerating: false, currentStep: 'Label generation failed' }));
      toast.error(err instanceof Error ? err.message : 'Failed to create labels');
      updateCurrentResultsAndStatus({ ...currentResults, uploadStatus: 'error' }, 'error');
    }
  };

  const handleOpenBatchPrintPreview = () => {
    if (currentResults?.batchResult) setBatchPrintPreviewModalOpen(true);
    else toast.error("No batch results to preview.");
  };

  const downloadBatchPdf = () => {
    const pdfUrl = currentResults?.batchResult?.consolidatedLabelUrls?.pdf;
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `batch_labels_${currentResults.batchResult?.batchId || Date.now()}.pdf`;
      link.click();
      toast.success('Batch PDF download started.');
    } else toast.error('Batch PDF not available.');
  };

  return {
    file, 
    isUploading: isParsingFile || isFetchingRates || labelGenerationProgress.isGenerating,
    uploadStatus: overallUploadStatus, 
    results: currentResults,
    progress: parsingProgress, 
    isFetchingRates, 
    isPaying, 
    isCreatingLabels: labelGenerationProgress.isGenerating,
    searchTerm, sortField, sortDirection, selectedCarrierFilter, filteredShipments,
    pickupAddress, setPickupAddress,
    handleFileChange, 
    handleUpload: handleFullUploadProcess, 
    handleSelectRate: managedSelectRate,
    handleRemoveShipment: managedRemoveShipment,
    handleEditShipment: managedEditShipment,
    handleRefreshRates: managedRefreshRates,
    handleBulkApplyCarrier: managedBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview, batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen,
    handleDownloadLabelsWithFormat, handleDownloadSingleLabel, handleEmailLabels,
    handleDownloadTemplate, 
    setSearchTerm, setSortField, setSortDirection, setSelectedCarrierFilter,
    labelGenerationProgress,
    downloadBatchPdf
  };
};

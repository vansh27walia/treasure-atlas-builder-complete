
import { useState, useEffect } from 'react';
import { BulkUploadResult, BulkShipment, BatchResult } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { SavedAddress } from '@/services/AddressService';
import { addressService } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useBulkUpload = () => {
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [singleLabelToPreview, setSingleLabelToPreview] = useState<BulkShipment | null>(null);
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
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange,
    handleUpload: originalHandleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const updateResults = (newResults: BulkUploadResult) => {
    console.log('Updating results in useBulkUpload:', newResults);
    setResults(newResults);
    
    if (newResults.uploadStatus && newResults.uploadStatus !== uploadStatus) {
      // Only update status if it's one of the types compatible with useShipmentUpload's state
      const compatibleStatuses = ['idle', 'uploading', 'success', 'error', 'editing', 'creating-labels'];
      if (compatibleStatuses.includes(newResults.uploadStatus)) {
        setUploadStatus(newResults.uploadStatus as 'idle' | 'uploading' | 'success' | 'error' | 'editing' | 'creating-labels');
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
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels: originalHandleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel: downloadSingleLabelFile, // Aliased to avoid name conflict
    handleEmailLabels
  } = useShipmentManagement(results, updateResults);

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
          }
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
        toast.error('Error loading pickup addresses. Please check your settings.');
      }
    };
    
    loadDefaultPickupAddress();
  }, []);

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    let shipmentsArray = [];
    if (Array.isArray(results.processedShipments)) {
      shipmentsArray = results.processedShipments;
    } else if (results.processedShipments && typeof results.processedShipments === 'object') {
      shipmentsArray = Object.values(results.processedShipments).filter(Boolean);
    }
    
    const shipmentsToProcess = shipmentsArray.filter(s => s.selectedRateId && s.easypost_id) || [];
    
    if (shipmentsToProcess.length === 0) {
      toast.error('No shipments with selected rates found');
      return;
    }

    const totalShipments = shipmentsArray.length;
    const shipmentsWithRates = shipmentsToProcess.length;
    
    if (shipmentsWithRates !== totalShipments) {
      const missingRates = totalShipments - shipmentsWithRates;
      toast.error(`${missingRates} shipment(s) are missing rate selections. ALL shipments must have rates selected before creating labels.`);
      console.error(`Rate validation failed: ${shipmentsWithRates}/${totalShipments} shipments have rates selected`);
      return;
    }
    
    console.log(`✅ Validation passed: Creating labels for ALL ${shipmentsToProcess.length} shipments with rates selected`);
    
    setLabelGenerationProgress({
      isGenerating: true,
      totalShipments: shipmentsToProcess.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      currentStep: 'Starting label generation...',
      estimatedTimeRemaining: shipmentsToProcess.length * 8 
    });
    
    try {
      setUploadStatus('creating-labels');
      
      const progressInterval = setInterval(() => {
        setLabelGenerationProgress(prev => ({
          ...prev,
          estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - 1)
        }));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: shipmentsToProcess,
          pickupAddress,
        }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Label creation error from Supabase function:', error);
        throw new Error(error.message || 'Unknown error from label generation function.');
      }

      console.log('Raw label creation response from create-enhanced-bulk-labels:', data);

      if (data && data.processedLabels) {
        const expectedLabels = shipmentsToProcess.length;
        
        setLabelGenerationProgress({
          isGenerating: false,
          totalShipments: expectedLabels,
          processedShipments: expectedLabels, // Assuming all attempts are "processed"
          successfulShipments: data.successful || 0,
          failedShipments: data.failed || 0,
          currentStep: 'Label generation complete!',
          estimatedTimeRemaining: 0
        });

        const transformedSuccessfulShipments = (data.processedLabels || []).map((labelData: any) => {
          const originalShipment = shipmentsToProcess.find(s => s.id === labelData.original_shipment_id);
          return {
            id: labelData.id || originalShipment?.id || `ship_${Date.now()}`,
            shipment_id: labelData.id,
            easypost_id: labelData.id,
            original_shipment_id: labelData.original_shipment_id,
            row: originalShipment?.row || 0,
            recipient: labelData.customer_name || originalShipment?.recipient || 'Unknown Recipient',
            customer_name: labelData.customer_name,
            customer_address: labelData.customer_address,
            carrier: labelData.carrier,
            service: labelData.service,
            rate: parseFloat(labelData.rate) || 0,
            tracking_code: labelData.tracking_code,
            tracking_number: labelData.tracking_code,
            label_url: labelData.label_url,
            label_urls: labelData.label_urls,
            status: 'completed' as const,
            details: originalShipment?.details || {},
            availableRates: originalShipment?.availableRates || [],
            selectedRateId: originalShipment?.selectedRateId,
          };
        });
        
        const transformedFailedShipments = (data.failedLabels || []).map((failed: any) => {
            const originalFailedShipment = shipmentsToProcess.find(s => s.id === failed.shipmentId);
            return {
                ...(originalFailedShipment || { id: failed.shipmentId, details: {}, recipient: 'Unknown', row: failed.row }),
                status: 'failed' as const,
                error: failed.error || 'Label creation failed',
            };
        });


        const allTransformedShipments = [...transformedSuccessfulShipments, ...transformedFailedShipments].sort((a,b) => a.row - b.row);
        
        let frontendBatchResult: BatchResult | null = null;
        if (data.batchResult && data.batchResult.batchId) {
            frontendBatchResult = {
                batchId: data.batchResult.batchId,
                consolidatedLabelUrls: {
                    pdf: data.batchResult.consolidatedLabelUrls?.pdf,
                    zpl: data.batchResult.consolidatedLabelUrls?.zpl,
                    epl: data.batchResult.consolidatedLabelUrls?.epl,
                },
                scanFormUrl: data.batchResult.scanFormUrl || null,
            };
        }

        const updatedResults: BulkUploadResult = {
          total: data.total || shipmentsToProcess.length,
          successful: data.successful || 0,
          failed: data.failed || 0,
          totalCost: transformedSuccessfulShipments.reduce((sum, s) => sum + (s.rate || 0), 0),
          processedShipments: allTransformedShipments,
          failedShipments: data.failedLabels || [],
          batchResult: frontendBatchResult,
          uploadStatus: 'success' as const,
          pickupAddress
        };

        console.log(`✅ Label creation complete: ${updatedResults.processedShipments.length} total shipments (${updatedResults.successful} successful, ${updatedResults.failed} failed)`);
        updateResults(updatedResults);
        
        if (updatedResults.successful > 0 && updatedResults.failed === 0) {
          toast.success(`🎉 ALL ${updatedResults.successful} shipping labels generated!`);
        } else if (updatedResults.successful > 0) {
          toast.warning(`⚠️ ${updatedResults.successful} out of ${expectedLabels} labels created. ${updatedResults.failed} failed.`);
        } else {
           toast.error(`❌ All ${expectedLabels} label creations failed. Check details.`);
        }

        if (frontendBatchResult) {
          toast.success('✅ Batch outputs (PDF, ZPL, Manifest) generated successfully!');
        }
        if (transformedFailedShipments.length > 0) {
          toast.error(`${transformedFailedShipments.length} labels failed to create. Check details in the table.`);
        }

      } else {
        console.error('Invalid response format or no labels created by backend:', data);
        throw new Error(data?.error || 'No labels were created or invalid response format from backend.');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      setLabelGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        currentStep: 'Label generation failed'
      }));
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
      setUploadStatus('error');
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('handleFileUpload called with:', { file: file.name, pickupAddress });
    
    if (!pickupAddress) {
      const errorMsg = 'Pickup address is required. Please add a pickup address in Settings first.';
      toast.error(errorMsg, {
        description: 'Go to Settings > Pickup Address to add your shipping address.',
        action: {
          label: 'Go to Settings',
          onClick: () => window.location.href = '/settings'
        }
      });
      throw new Error(errorMsg);
    }
    
    return originalHandleUpload(file, pickupAddress);
  };

  const handleOpenBatchPrintPreview = () => {
    if (results?.batchResult) {
      setBatchPrintPreviewModalOpen(true);
    } else {
      toast.error("No batch results available to preview. Please generate labels first.");
    }
  };
  
  const handlePreviewSingleLabel = (shipment: BulkShipment) => { // This was handleDownloadSingleLabel, now it's for previews
    if (shipment.label_urls?.pdf) {
      setSingleLabelToPreview(shipment);
    } else {
      toast.error("PDF preview is not available for this label.");
    }
  };

  return {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isPaying,
    isCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    setPickupAddress,
    handleFileChange,
    handleUpload: handleFileUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel: downloadSingleLabelFile, // Pass through the file downloader
    handlePreviewSingleLabel, // Pass through the preview modal handler
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress,
    singleLabelToPreview,
    setSingleLabelToPreview,
  };
};

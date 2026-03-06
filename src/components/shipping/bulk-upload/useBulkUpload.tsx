import { useState, useEffect, useRef } from 'react';
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
  // Ref to hold Shopify order mapping for fulfillment sync-back
  const shopifyOrderMapRef = useRef<Record<string, { shopify_order_id: string; shop: string }>>({});
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [batchError, setBatchError] = useState<{ packageNumber: number; error: string; shipmentId: string } | null>(null);
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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  
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
    console.log('Updating results in useBulkUpload (merge mode):', newResults);
    
    // When processedShipments are provided, recompute insurance based on flags and declared value, then recalc totals
    if (newResults.processedShipments && Array.isArray(newResults.processedShipments)) {
      const normalizedShipments = newResults.processedShipments.map((s) => {
        const declared = Number((((s as any).declared_value ?? (s as any).details?.declared_value) ?? 0) || 0);
        const enabled = (s as any).insurance_enabled !== false;
        const insurance_cost = enabled && declared > 0 ? Math.ceil(declared / 100) * 2 : 0;
        return { ...s, insurance_cost };
      });
      newResults.processedShipments = normalizedShipments as any;
      const calculatedInsuranceTotal = normalizedShipments.reduce((sum, shipment) => sum + (shipment.insurance_cost || 0), 0);
      const calculatedRowTotal = normalizedShipments.reduce((sum, shipment) => sum + (shipment.rate || 0) + (shipment.insurance_cost || 0), 0);
      newResults.totalCost = calculatedRowTotal; // Use sum of all row totals
      newResults.totalInsurance = calculatedInsuranceTotal;
    }
    
    // Merge with latest state to prevent overwriting newer fields with stale data
    setResults((prev) => {
      const merged: BulkUploadResult = {
        ...(prev || ({} as BulkUploadResult)),
        ...newResults,
      } as BulkUploadResult;

      // If processedShipments were not part of the newResults, keep previous list
      if (!('processedShipments' in newResults) && prev) {
        merged.processedShipments = prev.processedShipments;
      }

      // Ensure totals are consistent; recompute insurance from shipment settings
      if (merged.processedShipments && Array.isArray(merged.processedShipments)) {
        const normalized = merged.processedShipments.map((s) => {
          const declared = (s.declared_value ?? s.details?.declared_value ?? 0) as number;
          const enabled = (s as any).insurance_enabled !== false;
          const insurance_cost = enabled && declared > 0 ? Math.ceil(declared / 100) * 2 : 0;
          return { ...s, insurance_cost };
        });
        merged.processedShipments = normalized as any;
        const insuranceTotal = normalized.reduce((sum, s) => sum + (s.insurance_cost || 0), 0);
        const rowTotal = normalized.reduce((sum, s) => sum + (s.rate || 0) + (s.insurance_cost || 0), 0);
        merged.totalCost = rowTotal; // Use sum of all row totals
        merged.totalInsurance = insuranceTotal;
      }

      return merged;
    });
    
    if ((newResults as any).uploadStatus && (newResults as any).uploadStatus !== uploadStatus) {
      const compatibleStatuses = ['idle', 'uploading', 'success', 'error', 'editing', 'creating-labels'];
      if (compatibleStatuses.includes((newResults as any).uploadStatus)) {
        setUploadStatus((newResults as any).uploadStatus);
      }
    }
  };

  const {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleRefreshRatesAfterEdit,
    handleBulkApplyCarrier
  } = useShipmentRates(results, updateResults);

  const {
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment: originalHandleEditShipment,
    handleProceedToPayment,
    handleCreateLabels: originalHandleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels
  } = useShipmentManagement(results, updateResults);

  const {
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    advancedFilters,
    filteredShipments,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setAdvancedFilters
  } = useShipmentFiltering(results);

  useEffect(() => {
    const loadDefaultPickupAddress = async () => {
      try {
        console.log('Loading default pickup address...');
        const defaultAddress = await addressService.getDefaultFromAddress();
        console.log("Loaded default pickup address:", defaultAddress);
        if (defaultAddress) {
          setPickupAddress(defaultAddress);
          setResults((prev) => ({ ...(prev as any), pickupAddress: defaultAddress } as any));
        } else {
          const addresses = await addressService.getSavedAddresses();
          if (addresses.length > 0) {
            const firstAddress = addresses[0];
            setPickupAddress(firstAddress);
            console.log("Using first available address:", firstAddress);
            setResults((prev) => ({ ...(prev as any), pickupAddress: firstAddress } as any));
          }
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
        toast.error('Error loading pickup addresses. Please check your settings.');
      }
    };
    
    loadDefaultPickupAddress();
  }, []);

  // Auto-process Shopify orders from sessionStorage (skips CSV upload + header mapping)
  useEffect(() => {
    const shopifyCSV = sessionStorage.getItem('shopify_auto_csv');
    const isShopifyBatch = sessionStorage.getItem('shopify_auto_batch');
    
    if (shopifyCSV && isShopifyBatch === 'true') {
      console.log('🛒 Auto-processing Shopify orders from sessionStorage...');
      // Read and store Shopify order mapping before clearing
      const orderMapStr = sessionStorage.getItem('shopify_order_map');
      if (orderMapStr) {
        try {
          shopifyOrderMapRef.current = JSON.parse(orderMapStr);
          console.log('📦 Loaded Shopify order map:', Object.keys(shopifyOrderMapRef.current).length, 'orders');
        } catch (e) {
          console.error('Failed to parse shopify_order_map:', e);
        }
      }
      // Clear immediately to prevent re-processing on re-render
      sessionStorage.removeItem('shopify_auto_csv');
      sessionStorage.removeItem('shopify_auto_batch');
      sessionStorage.removeItem('shopify_order_count');
      sessionStorage.removeItem('shopify_order_map');
      
      // Create a File object from the CSV string and trigger upload
      const blob = new Blob([shopifyCSV], { type: 'text/csv' });
      const file = new File([blob], 'shopify-orders.csv', { type: 'text/csv' });
      
      // Wait for pickup address to be loaded, then auto-upload
      const attemptUpload = async () => {
        // Small delay to ensure pickup address is loaded
        await new Promise(r => setTimeout(r, 1000));
        
        if (pickupAddress) {
          console.log('🚀 Auto-uploading Shopify CSV with pickup address');
          try {
            await originalHandleUpload(file, pickupAddress);
            toast.success('Shopify orders auto-processed! Select rates below.');
          } catch (err) {
            console.error('Auto-upload failed:', err);
          }
        } else {
          // Try loading address first
          const addr = await addressService.getDefaultFromAddress();
          if (addr) {
            setPickupAddress(addr);
            await originalHandleUpload(file, addr);
            toast.success('Shopify orders auto-processed! Select rates below.');
          } else {
            toast.error('Please set a pickup address in Settings first.');
          }
        }
      };
      
      attemptUpload();
    }
  }, [pickupAddress]);

  const handleEditShipment = async (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) return;
    
    try {
      console.log('Editing shipment with updates:', { shipmentId, updates });
      
      // Find the shipment to edit
      const shipment = results.processedShipments.find(s => s.id === shipmentId);
      if (!shipment) {
        console.error('Shipment not found for editing:', shipmentId);
        toast.error('Shipment not found');
        return;
      }
      
      // Create the updated shipment and keep current rates visible until new ones arrive
      const updatedShipment = { 
        ...shipment, 
        ...updates,
        // Preserve current rate selection and rates to avoid UI flicker while saving
        selectedRateId: shipment.selectedRateId,
        carrier: shipment.carrier,
        service: shipment.service,
        rate: shipment.rate,
        availableRates: shipment.availableRates || []
      };
      // First update the shipment details using the original function
      await originalHandleEditShipment(updatedShipment);
      
      // Wait to ensure save completes before fetching (per request)
      console.log('Edit saved. Waiting 30s before fetching new rates to avoid race...');
      await new Promise((res) => setTimeout(res, 30000));
      toast.info('Fetching new rates now...', { duration: 3000 });
      
      // Then refresh rates for the updated shipment using fresh data (avoids race)
      console.log('Refreshing rates after shipment edit with fresh payload...');
      await handleRefreshRatesAfterEdit(updatedShipment);
      // ENHANCED: Recalculate row totals after edit
      if (results) {
        const updatedShipments = results.processedShipments.map(s => {
          const merged = s.id === shipment.id ? updatedShipment : s;
          const m: any = merged as any;
          const declared = Number((m.declared_value ?? m.details?.declared_value ?? 0) || 0);
          const insurance_cost = declared > 0 ? Math.ceil(declared / 100) * 2 : 0;
          return { ...merged, insurance_cost };
        });
        
        // Calculate totals from current rows (rate + insurance per shipment)
        const newInsuranceTotal = updatedShipments.reduce((sum, s) => sum + (s.insurance_cost || 0), 0);
        const newFinalTotal = updatedShipments.reduce((sum, s) => (sum + (s.rate || 0) + (s.insurance_cost || 0)), 0);
        
        console.log('Row totals after edit (insurance recalculated from settings):', {
          editedShipmentId: shipment.id,
          newInsuranceTotal,
          newFinalTotal,
          rowBreakdown: updatedShipments.map(s => ({
            id: s.id,
            rate: s.rate || 0,
            insurance: s.insurance_cost || 0,
            rowTotal: (s.rate || 0) + (s.insurance_cost || 0)
          }))
        });
        
        updateResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: newFinalTotal, // Use sum of all row totals
          totalInsurance: newInsuranceTotal
        });
      }
      
      toast.success('Shipment updated and row totals recalculated');
    } catch (error) {
      console.error('Error updating shipment and refreshing rates:', error);
      toast.error('Failed to update shipment or refresh rates');
    }
  };

  useEffect(() => {
    if (paymentCompleted && !isCreatingLabels && results && results.processedShipments.length > 0) {
      console.log('Payment completed, auto-starting label creation...');
      handleCreateLabels();
      setPaymentCompleted(false);
    }
  }, [paymentCompleted, isCreatingLabels, results]);

  const handlePaymentSuccess = () => {
    console.log('Payment successful, triggering label creation...');
    setPaymentCompleted(true);
    toast.success('Payment successful! Creating labels automatically...');
    
    // Auto-trigger label creation after payment success
    setTimeout(() => {
      console.log('Auto-triggering label creation after payment success...');
      handleCreateLabels();
    }, 1000); // Small delay to ensure payment processing is complete
  };

  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setBatchError(null);
    
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

      console.log('Invoking create-bulk-labels with payload:', {
        shipments: shipmentsToProcess.map(s => ({
          id: s.id,
          easypost_id: s.easypost_id,
          selectedRateId: s.selectedRateId,
          carrier: s.carrier,
          service: s.service,
          rate: s.rate,
          hasDetails: !!s.details,
          to: {
            name: s.details?.to_name || s.customer_name || s.recipient,
            zip: s.details?.to_zip,
            country: s.details?.to_country
          }
        })),
        pickupAddress
      });

      // Attach Shopify metadata to shipments for fulfillment sync-back
      const shipmentsWithShopify = shipmentsToProcess.map(s => {
        const reference = s.details?.reference || s.id;
        const shopifyMeta = shopifyOrderMapRef.current[reference];
        if (shopifyMeta) {
          return { ...s, shopify_order_id: shopifyMeta.shopify_order_id, shopify_shop: shopifyMeta.shop };
        }
        return s;
      });

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: shipmentsWithShopify,
          pickupAddress,
          labelOptions: {
            generateBatch: true,
            generateManifest: true,
            haltOnFailure: true
          }
        }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Label creation error from Supabase function:', error);
        
        if (error.message && error.message.includes('Batch halted')) {
          const errorMatch = error.message.match(/Package #(\d+)/);
          const packageNumber = errorMatch ? parseInt(errorMatch[1]) : 1;
          const failedShipment = shipmentsToProcess[packageNumber - 1];
          
          setBatchError({
            packageNumber,
            error: error.message,
            shipmentId: failedShipment?.id || 'unknown'
          });
          
          setLabelGenerationProgress({
            isGenerating: false,
            totalShipments: shipmentsToProcess.length,
            processedShipments: packageNumber - 1,
            successfulShipments: 0,
            failedShipments: 1,
            currentStep: 'Batch halted due to error',
            estimatedTimeRemaining: 0
          });
          
          toast.error(`Batch halted. Package #${packageNumber} couldn't be processed. Please fix the issue to continue.`, {
            duration: 10000
          });
          
          return;
        }
        
        throw new Error(error.message || 'Unknown error from label generation function.');
      }

      console.log('Raw label creation response from create-bulk-labels:', data);

      if (data && data.processedLabels && Array.isArray(data.processedLabels)) {
        const expectedLabels = shipmentsToProcess.length;
        const actualLabels = data.processedLabels.length;
        
        setLabelGenerationProgress({
          isGenerating: false,
          totalShipments: expectedLabels,
          processedShipments: expectedLabels,
          successfulShipments: actualLabels,
          failedShipments: data.failedLabels?.length || (expectedLabels - actualLabels),
          currentStep: 'Label generation complete!',
          estimatedTimeRemaining: 0
        });

        const transformedSuccessfulShipments = data.processedLabels.map((labelData: any) => {
          const originalShipment = shipmentsToProcess.find(s => 
            s.easypost_id === labelData.id || s.id === labelData.original_shipment_id || s.id === labelData.id
          );
          return {
            id: labelData.id || originalShipment?.id || `ship_${Date.now()}`,
            shipment_id: labelData.id,
            easypost_id: labelData.id,
            original_shipment_id: labelData.original_shipment_id || originalShipment?.id,
            row: originalShipment?.row || 0,
            recipient: labelData.customer_name || originalShipment?.recipient || 'Unknown Recipient',
            customer_name: labelData.customer_name || originalShipment?.customer_name,
            customer_address: labelData.customer_address || originalShipment?.customer_address,
            carrier: labelData.carrier || originalShipment?.carrier,
            service: labelData.service || originalShipment?.service,
            rate: parseFloat(labelData.rate) || originalShipment?.rate || 0,
            insurance_cost: originalShipment?.insurance_cost ?? 2,
            tracking_code: labelData.tracking_code,
            tracking_number: labelData.tracking_code,
            label_url: labelData.label_urls?.png || labelData.label_url,
            label_urls: labelData.label_urls || { png: labelData.label_url },
            status: 'completed' as const,
            details: originalShipment?.details || {},
            availableRates: originalShipment?.availableRates || [],
            selectedRateId: originalShipment?.selectedRateId,
          };
        });
        
        const transformedFailedShipments = (data.failedLabels || []).map((failed: any) => {
            const originalFailedShipment = shipmentsToProcess.find(s => s.id === failed.shipmentId || s.easypost_id === failed.shipmentId);
            return {
                ...(originalFailedShipment || { id: failed.shipmentId, details: {}, recipient: 'Unknown' }),
                status: 'failed' as const,
                error: failed.error || 'Label creation failed',
            };
        });

        const allTransformedShipments = [...transformedSuccessfulShipments, ...transformedFailedShipments];
        
        let frontendBatchResult: BatchResult | null = null;
        if (data.batchResult && data.batchResult.batchId) {
            console.log('Processing batch result:', data.batchResult);
            frontendBatchResult = {
                batchId: data.batchResult.batchId,
                consolidatedLabelUrls: {
                    pdf: data.batchResult.batchLabelUrls?.pdfUrl || data.batchResult.consolidatedLabelUrls?.pdf,
                    zpl: data.batchResult.batchLabelUrls?.zplUrl || data.batchResult.consolidatedLabelUrls?.zpl,
                    epl: data.batchResult.batchLabelUrls?.eplUrl || data.batchResult.consolidatedLabelUrls?.epl,
                },
                scanFormUrl: data.batchResult.scanFormUrl || null,
            };
            console.log('Created frontend batch result:', frontendBatchResult);
        }

        const updatedResults: BulkUploadResult = {
          total: data.total || shipmentsToProcess.length,
          successful: data.successful || transformedSuccessfulShipments.length,
          failed: data.failed || transformedFailedShipments.length,
          totalCost: transformedSuccessfulShipments.reduce((sum, s) => sum + (s.rate || 0) + (s.insurance_cost || 0), 0), // Sum of all row totals
          processedShipments: allTransformedShipments,
          failedShipments: (data.failedLabels || []).map((f:any) => ({ shipmentId: f.shipmentId, error: f.error, row: shipmentsToProcess.find(s => s.id === f.shipmentId)?.row })),
          batchResult: frontendBatchResult,
          bulk_label_pdf_url: frontendBatchResult?.consolidatedLabelUrls?.pdf || null,
          uploadStatus: 'success' as const,
          pickupAddress
        };

        console.log(`✅ Label creation complete: ${updatedResults.processedShipments.length} total shipments (${updatedResults.successful} successful, ${updatedResults.failed} failed)`);
        console.log('Final batch result being set:', updatedResults.batchResult);
        updateResults(updatedResults);
        
        if (updatedResults.successful === expectedLabels && expectedLabels > 0) {
          toast.success(`🎉 ALL ${transformedSuccessfulShipments.length} shipping labels generated!`);
        } else if (transformedSuccessfulShipments.length > 0) {
          toast.warning(`⚠️ ${transformedSuccessfulShipments.length} out of ${expectedLabels} labels created. ${transformedFailedShipments.length} failed.`);
        } else if (expectedLabels > 0) {
           toast.error(`❌ All ${expectedLabels} label creations failed. Check details.`);
        }

        if (frontendBatchResult) {
          toast.success('✅ Batch outputs (PDF, ZPL, EPL, Manifest) generated successfully!');
        }
        if (transformedFailedShipments.length > 0) {
          toast.error(`${transformedFailedShipments.length} labels failed to create. Check details in the table if shown.`);
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

  const handleUpload = async (file: File) => {
    console.log('handleUpload called with:', { file: file.name, pickupAddress });
    
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

  const handleClearBatchError = () => {
    setBatchError(null);
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
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
    advancedFilters,
    filteredShipments,
    pickupAddress,
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    showAddPaymentModal,
    setPickupAddress,
    setBatchPrintPreviewModalOpen,
    setShowAddPaymentModal,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleClearBatchError,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setResults,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setAdvancedFilters,
    handlePaymentSuccess,
    handleAddPaymentMethod,
  };
};

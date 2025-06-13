import { useState, useEffect } from 'react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
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
  const [labelGenerationProgress, setLabelGenerationProgress] = useState({
    isGenerating: false,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
    currentStep: '',
    estimatedTimeRemaining: 0
  });
  
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

  // Update results wrapper function
  const updateResults = (newResults: BulkUploadResult) => {
    console.log('Updating results in useBulkUpload:', newResults);
    setResults(newResults);
    
    // If a new upload status is provided, update it
    if (newResults.uploadStatus && newResults.uploadStatus !== uploadStatus) {
      setUploadStatus(newResults.uploadStatus);
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
    showLabelOptions,
    downloadFormat,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
    handleCreateLabels: originalHandleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels,
    setShowLabelOptions,
    setDownloadFormat
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

  // Load the default pickup address when the component initializes
  useEffect(() => {
    const loadDefaultPickupAddress = async () => {
      try {
        console.log('Loading default pickup address...');
        const defaultAddress = await addressService.getDefaultFromAddress();
        console.log("Loaded default pickup address:", defaultAddress);
        if (defaultAddress) {
          setPickupAddress(defaultAddress);
        } else {
          // If no default, get the first available address
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

  // Enhanced handleCreateLabels with progress tracking
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
    
    // Initialize progress tracking
    setLabelGenerationProgress({
      isGenerating: true,
      totalShipments: shipmentsToProcess.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      currentStep: 'Starting label generation...',
      estimatedTimeRemaining: shipmentsToProcess.length * 8 // Estimate 8 seconds per shipment
    });
    
    try {
      setUploadStatus('creating-labels');
      
      // Update progress periodically
      const progressInterval = setInterval(() => {
        setLabelGenerationProgress(prev => ({
          ...prev,
          estimatedTimeRemaining: Math.max(0, prev.estimatedTimeRemaining - 1)
        }));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: shipmentsToProcess,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6',
            generateBatch: true,
            generateManifest: true
          }
        }
      });

      clearInterval(progressInterval);

      if (error) {
        console.error('Label creation error:', error);
        throw new Error(error.message);
      }

      console.log('Raw label creation response:', data);

      if (data && data.processedLabels && Array.isArray(data.processedLabels)) {
        const expectedLabels = shipmentsToProcess.length;
        const actualLabels = data.processedLabels.length;
        
        console.log(`Label creation result: ${actualLabels}/${expectedLabels} labels created successfully`);
        
        // Update progress with final results
        setLabelGenerationProgress({
          isGenerating: false,
          totalShipments: expectedLabels,
          processedShipments: expectedLabels,
          successfulShipments: actualLabels,
          failedShipments: expectedLabels - actualLabels,
          currentStep: 'Label generation complete!',
          estimatedTimeRemaining: 0
        });

        const transformedSuccessfulShipments = data.processedLabels.map((labelData: any) => {
          console.log('Processing successful label data:', labelData);
          
          const originalShipment = shipmentsToProcess.find(s => 
            s.easypost_id === labelData.id || s.id === labelData.id
          );
          
          return {
            id: labelData.id || originalShipment?.id || `ship_${Date.now()}`,
            shipment_id: labelData.id,
            easypost_id: labelData.id,
            row: originalShipment?.row || 0,
            recipient: labelData.customer_name || originalShipment?.recipient || 'Unknown Recipient',
            recipient_name: labelData.customer_name,
            customer_name: labelData.customer_name || originalShipment?.customer_name,
            customer_address: labelData.customer_address || originalShipment?.customer_address,
            customer_phone: labelData.customer_phone || originalShipment?.customer_phone || '',
            customer_email: labelData.customer_email || originalShipment?.customer_email || '',
            customer_company: labelData.customer_company || originalShipment?.customer_company || '',
            carrier: labelData.carrier || originalShipment?.carrier,
            service: labelData.service || originalShipment?.service,
            rate: parseFloat(labelData.rate) || originalShipment?.rate || 0,
            tracking_code: labelData.tracking_code,
            tracking_number: labelData.tracking_code,
            trackingCode: labelData.tracking_code,
            label_url: labelData.label_url,
            label_urls: labelData.label_urls || {
              png: labelData.label_url,
              pdf: labelData.label_url,
              zpl: labelData.label_url
            },
            status: 'completed' as const,
            details: originalShipment?.details || {
              to_name: labelData.customer_name || 'Unknown',
              to_company: labelData.customer_company || '',
              to_street1: '',
              to_street2: '',
              to_city: '',
              to_state: '',
              to_zip: '',
              to_country: 'US',
              to_phone: labelData.customer_phone || '',
              to_email: labelData.customer_email || '',
              weight: originalShipment?.details?.weight || 1,
              length: originalShipment?.details?.length || 1,
              width: originalShipment?.details?.width || 1,
              height: originalShipment?.details?.height || 1
            },
            availableRates: originalShipment?.availableRates || [],
            selectedRateId: originalShipment?.selectedRateId
          };
        });

        const transformedFailedShipments = [];
        if (data.failedLabels && Array.isArray(data.failedLabels)) {
          console.log(`Processing ${data.failedLabels.length} failed labels from backend`);
          
          data.failedLabels.forEach((failed: any) => {
            const originalShipment = shipmentsToProcess.find(s => s.id === failed.shipmentId);
            if (originalShipment) {
              transformedFailedShipments.push({
                ...originalShipment,
                status: 'failed' as const,
                error: failed.error || 'Label creation failed'
              });
            }
          });
        }

        const allTransformedShipments = [...transformedSuccessfulShipments, ...transformedFailedShipments];

        console.log(`Final transformation: ${transformedSuccessfulShipments.length} successful + ${transformedFailedShipments.length} failed = ${allTransformedShipments.length} total shipments`);

        const failedShipmentsForDisplay = data.failedLabels ? data.failedLabels.map((failed: any, index: number) => ({
          row: index + 1,
          error: failed.error || 'Unknown error',
          details: failed.error || 'Label creation failed',
          shipmentId: failed.shipmentId
        })) : [];

        const updatedResults: BulkUploadResult = {
          total: data.total || shipmentsToProcess.length,
          successful: data.successful || transformedSuccessfulShipments.length,
          failed: data.failed || transformedFailedShipments.length,
          totalCost: transformedSuccessfulShipments.reduce((sum, s) => sum + s.rate, 0),
          processedShipments: allTransformedShipments,
          failedShipments: failedShipmentsForDisplay,
          bulk_label_png_url: data.bulk_label_png_url || null,
          bulk_label_pdf_url: data.bulk_label_pdf_url || null,
          batchResult: data.batchResult || null,
          uploadStatus: 'success' as const,
          pickupAddress
        };

        console.log(`✅ Label creation complete: ${updatedResults.processedShipments.length} total shipments (${updatedResults.successful} successful, ${updatedResults.failed} failed)`);
        updateResults(updatedResults);
        
        if (updatedResults.successful === expectedLabels) {
          toast.success(`🎉 ALL ${transformedSuccessfulShipments.length} shipping labels created successfully in multiple formats!`);
        } else {
          toast.warning(`⚠️ ${transformedSuccessfulShipments.length} out of ${expectedLabels} labels created. ${transformedFailedShipments.length} failed.`);
        }

        if (data.batchResult) {
          toast.success('✅ Batch labels and manifest generated successfully!');
        }

        if (transformedFailedShipments.length > 0) {
          toast.error(`${transformedFailedShipments.length} labels failed to create. Check details below.`);
        }
      } else {
        console.error('Invalid response format or no labels:', data);
        throw new Error('No labels were created or invalid response format');
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

  // Modified handleUpload to include pickup address
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

  return {
    // File upload states and handlers
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    
    // Rate fetching states and handlers
    isFetchingRates,
    
    // Payment and label states and handlers
    isPaying,
    isCreatingLabels,
    showLabelOptions,
    downloadFormat,
    
    // Filtering states and handlers
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,

    // Pickup address
    pickupAddress,
    setPickupAddress,
    
    // Handlers from all hooks
    handleFileChange,
    handleUpload: handleFileUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setShowLabelOptions,
    setDownloadFormat,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress
  };
};

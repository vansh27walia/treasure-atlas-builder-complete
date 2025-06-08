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
    
    // Ensure processedShipments is always an array
    let processedShipments = [];
    if (Array.isArray(newResults.processedShipments)) {
      processedShipments = newResults.processedShipments;
    } else if (newResults.processedShipments && typeof newResults.processedShipments === 'object') {
      // Handle case where backend returns an object instead of array
      processedShipments = Object.values(newResults.processedShipments).filter(Boolean);
    }
    
    const resultsWithShipments = {
      ...newResults,
      processedShipments,
      pickupAddress: newResults.pickupAddress || pickupAddress
    };
    
    console.log('Setting results with processedShipments:', resultsWithShipments.processedShipments?.length);
    setResults(resultsWithShipments);
    
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

  // Enhanced handleCreateLabels with proper response processing
  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    // Handle both array and object cases for processedShipments
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
    
    console.log('Starting label creation for shipments:', shipmentsToProcess);
    
    try {
      toast.loading('Creating shipping labels...', { id: 'creating-labels' });
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: shipmentsToProcess,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Label creation error:', error);
        throw new Error(error.message);
      }

      console.log('Raw label creation response:', data);
      toast.dismiss('creating-labels');

      if (data && data.labels && Array.isArray(data.labels) && data.labels.length > 0) {
        console.log('Processing', data.labels.length, 'labels from backend');
        
        // Transform backend response into frontend format
        const transformedShipments = data.labels.map((labelData: any) => {
          console.log('Processing label data:', labelData);
          
          // Create a proper shipment object with all required fields
          const transformedShipment: BulkShipment = {
            id: labelData.shipment_id,
            shipment_id: labelData.shipment_id,
            row: 0, // Will be updated if we have original data
            recipient: labelData.recipient_name || 'Unknown Recipient',
            recipient_name: labelData.recipient_name,
            customer_name: labelData.recipient_name || 'Unknown',
            customer_address: labelData.drop_off_address || 'Address not provided',
            customer_phone: '',
            customer_email: '',
            customer_company: '',
            carrier: labelData.carrier || 'Unknown',
            service: labelData.service || 'Unknown',
            rate: parseFloat(labelData.rate) || 0,
            tracking_code: labelData.tracking_number,
            tracking_number: labelData.tracking_number,
            trackingCode: labelData.tracking_number,
            label_url: labelData.label_urls?.png || null,
            label_urls: {
              png: labelData.label_urls?.png || null,
              pdf: labelData.label_urls?.pdf || null,
              zpl: labelData.label_urls?.zpl || null
            },
            status: labelData.status?.includes('success') ? 'completed' as const : 'failed' as const,
            error: labelData.error,
            easypost_id: labelData.easypost_id,
            details: {
              to_name: labelData.recipient_name || 'Unknown',
              to_company: '',
              to_street1: '',
              to_street2: '',
              to_city: '',
              to_state: '',
              to_zip: '',
              to_country: 'US',
              to_phone: '',
              to_email: '',
              weight: 1,
              length: 1,
              width: 1,
              height: 1
            }
          };

          // Try to merge with original shipment data if available
          const originalShipment = shipmentsToProcess.find(s => s.id === labelData.shipment_id);
          if (originalShipment) {
            return {
              ...originalShipment,
              ...transformedShipment,
              // Preserve important original data
              details: originalShipment.details,
              customer_phone: originalShipment.customer_phone || '',
              customer_email: originalShipment.customer_email || '',
              customer_company: originalShipment.customer_company || ''
            };
          }

          return transformedShipment;
        }).filter(Boolean);

        console.log('Transformed shipments:', transformedShipments);

        // Count successful and failed labels
        const successfulLabels = transformedShipments.filter(s => s.status === 'completed').length;
        const failedLabels = transformedShipments.filter(s => s.status === 'failed').length;
        
        console.log(`Processing complete: ${successfulLabels} successful, ${failedLabels} failed`);

        const updatedResults: BulkUploadResult = {
          total: transformedShipments.length,
          successful: successfulLabels,
          failed: failedLabels,
          totalCost: transformedShipments.reduce((sum, s) => sum + s.rate, 0),
          processedShipments: transformedShipments,
          failedShipments: transformedShipments
            .filter(s => s.status === 'failed')
            .map((s, index) => ({
              row: index + 1,
              error: s.error || 'Unknown error',
              details: s.error || 'Label creation failed'
            })),
          bulk_label_png_url: data.bulk_label_png_url,
          bulk_label_pdf_url: data.bulk_label_pdf_url,
          uploadStatus: 'success' as const,
          pickupAddress
        };

        console.log('Final updated results with', updatedResults.processedShipments.length, 'shipments');
        updateResults(updatedResults);
        
        toast.success(`Successfully created ${successfulLabels} shipping labels!`);

        if (failedLabels > 0) {
          toast.error(`${failedLabels} labels failed to create. Check details below.`);
        }
      } else {
        console.error('Invalid response format or no labels:', data);
        throw new Error('No labels were created or invalid response format');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.dismiss('creating-labels');
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
    handleProceedToPayment: handleCreateLabels, // Use our custom handler for label creation
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
    setSelectedCarrierFilter
  };
};

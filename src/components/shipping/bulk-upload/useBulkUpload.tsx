import { useState, useEffect } from 'react';
import { BulkUploadResult } from '@/types/shipping';
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
    const resultsWithShipments = {
      ...newResults,
      processedShipments: Array.isArray(newResults.processedShipments) ? newResults.processedShipments : [],
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
    
    const shipmentsToProcess = results.processedShipments?.filter(s => s.selectedRateId && s.easypost_id) || [];
    
    if (shipmentsToProcess.length === 0) {
      toast.error('No shipments with selected rates found');
      return;
    }
    
    console.log('Starting label creation for shipments:', shipmentsToProcess);
    
    // Set creating labels status
    setUploadStatus('creating-labels');
    
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

      console.log('Label creation response:', data);
      toast.dismiss('creating-labels');

      if (data && data.labels && data.labels.length > 0) {
        // Process the response and ensure we have the current shipments
        const currentShipments = results.processedShipments || [];
        console.log('Current shipments before update:', currentShipments.length);
        
        const updatedShipments = currentShipments.map(shipment => {
          const labelData = data.labels.find((label: any) => 
            label.shipment_id === shipment.id || 
            label.easypost_id === shipment.easypost_id
          );
          
          if (labelData) {
            console.log(`Processing label data for shipment ${shipment.id}:`, labelData);
            
            // Handle successful labels
            if (labelData.status === 'success_individual_png_saved' && labelData.label_urls?.png) {
              return {
                ...shipment,
                label_url: labelData.label_urls.png,
                tracking_code: labelData.tracking_number,
                trackingCode: labelData.tracking_number,
                status: 'completed' as const,
                customer_name: labelData.recipient_name || shipment.details?.to_name || shipment.recipient,
                customer_address: labelData.drop_off_address || 
                  `${shipment.details?.to_street1}, ${shipment.details?.to_city}, ${shipment.details?.to_state} ${shipment.details?.to_zip}`,
                customer_phone: shipment.details?.to_phone || '',
                customer_email: shipment.details?.to_email || '',
                customer_company: shipment.details?.to_company || '',
              };
            }
            
            // Handle failed labels
            if (labelData.status && labelData.status.includes('error')) {
              return {
                ...shipment,
                status: 'failed' as const,
                error: labelData.error || 'Label creation failed',
              };
            }
          }
          return shipment;
        });

        // Count successful and failed labels
        const successfulLabels = updatedShipments.filter(s => s.label_url && s.label_url.trim() !== '');
        const failedLabels = data.labels.filter((label: any) => 
          label.status && (label.status.includes('error') || label.status.includes('fail'))
        );

        console.log(`Label creation results - Success: ${successfulLabels.length}, Failed: ${failedLabels.length}`);
        console.log('Updated shipments:', updatedShipments);

        const updatedResults: BulkUploadResult = {
          ...results,
          processedShipments: updatedShipments,
          successful: successfulLabels.length,
          failed: failedLabels.length,
          totalCost: results.totalCost || 0,
          total: updatedShipments.length,
          failedShipments: results.failedShipments || [],
          bulk_label_png_url: data.bulk_label_png_url,
          bulk_label_pdf_url: data.bulk_label_pdf_url,
          uploadStatus: 'success' as const
        };

        console.log('Final updated results before setting:', updatedResults);
        setResults(updatedResults);
        setUploadStatus('success');
        
        if (successfulLabels.length > 0) {
          toast.success(`Successfully created ${successfulLabels.length} shipping labels!`);
        }

        // Show any failed labels
        if (failedLabels.length > 0) {
          console.error('Failed labels:', failedLabels);
          toast.error(`${failedLabels.length} labels failed to create. Check console for details.`);
        }
      } else {
        console.error('Invalid response format:', data);
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

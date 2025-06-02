
import { useState, useEffect } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { SavedAddress } from '@/services/AddressService';
import { addressService } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

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
    console.log('Updating results:', newResults);
    
    // Add pickup address to results if not present
    const resultsWithPickup = {
      ...newResults,
      pickupAddress: newResults.pickupAddress || pickupAddress
    };
    
    setResults(resultsWithPickup);
    
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
    isCreatingLabels: managementIsCreatingLabels,
    showLabelOptions,
    downloadFormat,
    handleRemoveShipment,
    handleEditShipment,
    handleProceedToPayment,
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

  // Local state for label creation
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

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

  // Custom handleCreateLabels function
  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: results.processedShipments,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to create labels');
      }

      console.log('Label creation response:', data);

      if (data && data.labels && data.labels.length > 0) {
        // Process the response and update shipments with label information
        const updatedShipments = results.processedShipments.map(shipment => {
          const labelData = data.labels.find((label: any) => 
            label.shipment_id === shipment.id || 
            label.easypost_id === shipment.easypost_id
          );
          
          if (labelData && labelData.status?.includes('success')) {
            return {
              ...shipment,
              label_url: labelData.label_urls?.png || labelData.label_url,
              label_urls: labelData.label_urls || { png: labelData.label_url },
              tracking_code: labelData.tracking_number || labelData.tracking_code,
              trackingCode: labelData.tracking_number || labelData.tracking_code,
              batch_id: labelData.batch_id_storage_path || data.batch_id,
              batch_label_url: data.bulk_label_png_url || data.bulk_label_pdf_url,
              status: 'completed' as const
            };
          }
          return shipment;
        });

        // Update results with the new label information
        const updatedResults = {
          ...results,
          processedShipments: updatedShipments,
          uploadStatus: 'success' as const
        };

        console.log('Updated results with labels:', updatedResults);
        setResults(updatedResults);
        setUploadStatus('success');
        
        toast.success(`Successfully created ${data.labels.filter((l: any) => l.status?.includes('success')).length} shipping labels`);
      } else {
        console.error('No labels created or invalid response:', data);
        throw new Error('No labels were created successfully');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
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
    handleProceedToPayment,
    handleCreateLabels, // Use our custom implementation
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

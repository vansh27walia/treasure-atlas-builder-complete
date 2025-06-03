
import { useState, useEffect } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { SavedAddress } from '@/services/AddressService';
import { addressService } from '@/services/AddressService';
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
    isCreatingLabels,
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

  // Custom label creation handler for EasyPost
  const handleCreateLabels = async () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    try {
      console.log('Creating labels via EasyPost for', results.processedShipments.length, 'shipments');
      setUploadStatus('editing'); // Set to editing state while creating labels
      
      const response = await fetch('/functions/v1/create-bulk-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkaGVnZXpkenFsbnFxbnltdnBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MzI2MTIsImV4cCI6MjA2MTIwODYxMn0.TLYPK_o438RS7WTL9pxjq45KiZvam19lTeioeBDab-c`,
        },
        body: JSON.stringify({
          shipments: results.processedShipments,
          pickupAddress: pickupAddress,
          labelOptions: {
            format: 'pdf',
            size: '4x6'
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Label creation response:', data);
      
      if (data.status === 'finished_processing' && data.labels) {
        // Map the response to our expected format
        const updatedShipments = results.processedShipments.map((originalShipment) => {
          const labelInfo = data.labels.find(label => label.shipment_id === originalShipment.id);
          if (labelInfo && labelInfo.status.includes('success')) {
            return {
              ...originalShipment,
              label_url: labelInfo.label_urls?.png || null,
              tracking_code: labelInfo.tracking_number || null,
              trackingCode: labelInfo.tracking_number || null,
              status: 'completed' as const
            };
          }
          return originalShipment;
        });
        
        const updatedResults = {
          ...results,
          processedShipments: updatedShipments,
          bulk_label_png_url: data.bulk_label_png_url,
          bulk_label_pdf_url: data.bulk_label_pdf_url
        };
        
        updateResults(updatedResults);
        setUploadStatus('success');
        toast.success(`Successfully created ${data.total_labels_purchased_successfully_from_easypost} labels via EasyPost`);
        
        if (data.total_labels_input > data.total_labels_purchased_successfully_from_easypost) {
          const failedCount = data.total_labels_input - data.total_labels_purchased_successfully_from_easypost;
          toast.error(`${failedCount} labels failed to create`);
        }
      } else {
        throw new Error(data.message || 'Failed to create labels');
      }
      
    } catch (error) {
      console.error('Label creation error:', error);
      setUploadStatus('error');
      toast.error('Failed to create labels: ' + (error as Error).message);
    }
  };

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
    handleCreateLabels, // Use our custom EasyPost handler
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

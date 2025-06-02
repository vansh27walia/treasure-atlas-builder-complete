
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
    handleCreateLabels,
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

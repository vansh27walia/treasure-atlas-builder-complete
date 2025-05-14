
import { useState, useEffect } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { toast } from 'sonner';

export const useBulkUpload = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange,
    handleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  // Update results wrapper function
  const updateResults = (newResults: BulkUploadResult) => {
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

  // Fetch rates when shipments are processed
  useEffect(() => {
    const fetchRates = async () => {
      if (results?.processedShipments && 
          results.processedShipments.length > 0 && 
          (!results.processedShipments[0].availableRates || 
           results.processedShipments[0].availableRates.length === 0)) {
        await fetchAllShipmentRates(results.processedShipments);
      }
    };

    if (uploadStatus === 'editing') {
      fetchRates();
    }
  }, [uploadStatus, results?.processedShipments]);

  // Handle individual rate selection and label creation
  const handleRateSelectionAndLabel = async (shipmentId: string, rateId: string) => {
    try {
      // First select the rate
      handleSelectRate(shipmentId, rateId);
      
      // Then create the label
      toast("Generating label for selected rate...");
      
      // Update the UI to show we're generating labels
      updateResults({
        ...results,
        processedShipments: results.processedShipments.map(shipment => 
          shipment.id === shipmentId 
          ? { ...shipment, isGeneratingLabel: true } 
          : shipment
        )
      });
      
      // Create the label with specified format - Fixed the function call here
      await handleCreateLabels([shipmentId]);
      
      toast.success("Label generated successfully!");
      
    } catch (error) {
      console.error('Error in rate selection and label creation:', error);
      toast.error("Failed to generate label. Please try again.");
    }
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
    
    // Handlers from all hooks
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRateSelectionAndLabel, // New combined handler
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

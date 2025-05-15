
import { useState, useEffect } from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { useShipmentRates } from '@/hooks/useShipmentRates';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { useShipmentFiltering } from '@/hooks/useShipmentFiltering';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showLabelOptions, setShowLabelOptions] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');

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

  // Functions for shipment management
  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(s => s.id !== shipmentId);
    const removedShipment = results.processedShipments.find(s => s.id === shipmentId);
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    // Update results with new shipments and total
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost,
      successful: results.successful - 1,
      failedShipments: removedShipment 
        ? [...results.failedShipments, {
            row: removedShipment.row,
            error: 'Manually removed',
            details: 'User removed this shipment'
          }] 
        : results.failedShipments
    });
    
    toast.success("Shipment removed");
  };
  
  const handleEditShipment = (shipmentId: string) => {
    toast.info("Shipment editing will be implemented in a future update");
  };
  
  const handleProceedToPayment = () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error("No shipments to process");
      return;
    }
    
    setIsPaying(true);
    
    // Simulate payment process
    setTimeout(() => {
      updateResults({
        ...results,
        uploadStatus: 'success'
      });
      setIsPaying(false);
      toast.success("Payment processed successfully");
    }, 2000);
  };

  const handleCreateLabels = async () => {
    if (!results || results.processedShipments.length === 0) {
      toast.error("No shipments to process");
      return;
    }
    
    setIsCreatingLabels(true);
    
    try {
      const shipments = [...results.processedShipments];
      let successCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < shipments.length; i++) {
        const shipment = shipments[i];
        
        if (!shipment.selectedRateId) {
          shipments[i] = {
            ...shipment,
            status: 'error',
            error: 'No rate selected'
          };
          failedCount++;
          continue;
        }
        
        try {
          // Determine if it's an international shipment
          const isInternational = shipment.service?.toLowerCase().includes('international');
          const endpoint = isInternational ? 'create-international-label' : 'create-label';
          
          const { data, error } = await supabase.functions.invoke(endpoint, {
            body: {
              shipmentId: shipment.id,
              rateId: shipment.selectedRateId,
              options: {
                label_format: "PDF",
                label_size: "4x6"
              }
            }
          });
          
          if (error) throw new Error(error.message);
          
          if (!data || !data.labelUrl) {
            throw new Error("No label data returned");
          }
          
          shipments[i] = {
            ...shipment,
            status: 'completed',
            label_url: data.labelUrl,
            trackingCode: data.trackingCode
          };
          successCount++;
          
        } catch (err) {
          console.error(`Error creating label for shipment ${shipment.id}:`, err);
          shipments[i] = {
            ...shipment,
            status: 'error',
            error: `Failed to create label: ${err instanceof Error ? err.message : 'Unknown error'}`
          };
          failedCount++;
        }
        
        // Update the UI with progress
        updateResults({
          ...results,
          processedShipments: shipments
        });
      }
      
      updateResults({
        ...results,
        processedShipments: shipments,
        uploadStatus: 'success'
      });
      
      toast.success(`Created ${successCount} labels successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
      
    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error("Failed to create some labels");
    } finally {
      setIsCreatingLabels(false);
    }
  };
  
  const handleDownloadAllLabels = () => {
    // Check if all labels are generated
    const allLabelsGenerated = results?.processedShipments.every(s => s.label_url || s.status === 'completed');
    
    if (!allLabelsGenerated) {
      // If not all labels are generated, show options modal or create labels
      if (results?.uploadStatus === 'success') {
        setShowLabelOptions(true);
      } else {
        handleCreateLabels();
      }
      return;
    }
    
    // If all labels are generated, show format options
    setShowLabelOptions(true);
  };
  
  const handleDownloadLabelsWithFormat = (format: 'pdf' | 'png' | 'zpl') => {
    if (!results) return;
    
    setShowLabelOptions(false);
    setDownloadFormat(format);
    
    // Get all shipments with labels
    const shipmentsWithLabels = results.processedShipments.filter(s => s.label_url);
    
    if (shipmentsWithLabels.length === 0) {
      toast.error("No labels available to download");
      return;
    }
    
    // Download each label individually
    shipmentsWithLabels.forEach(shipment => {
      if (shipment.label_url) {
        const a = document.createElement('a');
        a.href = shipment.label_url;
        a.download = `label-${shipment.trackingCode || shipment.id}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
    
    toast.success(`Downloaded ${shipmentsWithLabels.length} labels in ${format.toUpperCase()} format`);
  };
  
  const handleDownloadSingleLabel = (shipmentId: string) => {
    if (!results) return;
    
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    
    if (!shipment || !shipment.label_url) {
      toast.error("Label not available for this shipment");
      return;
    }
    
    const a = document.createElement('a');
    a.href = shipment.label_url;
    a.download = `label-${shipment.trackingCode || shipment.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("Label download started");
  };
  
  const handleEmailLabels = (email?: string) => {
    setShowLabelOptions(false);
    
    // This would be implemented with a backend function
    toast.info("Email feature coming soon");
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

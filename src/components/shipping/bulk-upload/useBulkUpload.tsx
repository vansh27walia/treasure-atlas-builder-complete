
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
        // Transform the backend response to match frontend expectations
        const updatedShipments = data.labels.map((label: any) => {
          // Find the original shipment data with proper typing
          const originalShipment: BulkShipment | undefined = shipmentsToProcess.find(s => s.id === label.shipment_id);
          
          // Provide fallback values for required fields
          const baseShipment: BulkShipment = originalShipment || {
            id: label.shipment_id || '',
            row: 0,
            recipient: label.recipient_name || '',
            carrier: label.carrier || '',
            service: label.service || '',
            rate: parseFloat(label.rate) || 0,
            status: 'pending' as const,
            details: {
              to_name: label.recipient_name || '',
              to_street1: '',
              to_city: '',
              to_state: '',
              to_zip: '',
              to_country: 'US',
              weight: 0,
              length: 0,
              width: 0,
              height: 0
            }
          };
          
          return {
            ...baseShipment,
            // Map backend response fields to frontend fields
            id: label.shipment_id,
            shipment_id: label.shipment_id,
            status: label.status?.startsWith('success') ? 'completed' as const : 'failed' as const,
            label_url: label.label_urls?.png || null,
            label_urls: label.label_urls || { png: null },
            tracking_code: label.tracking_number,
            tracking_number: label.tracking_number,
            trackingCode: label.tracking_number,
            recipient: label.recipient_name || baseShipment.recipient,
            recipient_name: label.recipient_name,
            customer_name: label.recipient_name || baseShipment.customer_name,
            customer_address: label.drop_off_address || baseShipment.customer_address,
            customer_phone: baseShipment.customer_phone || '',
            customer_email: baseShipment.customer_email || '',
            customer_company: baseShipment.customer_company || '',
            carrier: label.carrier || baseShipment.carrier,
            service: label.service || baseShipment.service,
            rate: parseFloat(label.rate) || baseShipment.rate,
            easypost_id: label.easypost_id || baseShipment.easypost_id,
            error: label.error
          };
        });

        console.log('Updated shipments with labels:', updatedShipments);

        // Count successful labels
        const successfulLabels = updatedShipments.filter(s => s.status === 'completed').length;
        const failedLabels = updatedShipments.filter(s => s.status === 'failed').length;

        const updatedResults: BulkUploadResult = {
          ...results,
          processedShipments: updatedShipments,
          successful: successfulLabels,
          failed: failedLabels,
          totalCost: results.totalCost || 0,
          total: updatedShipments.length,
          failedShipments: updatedShipments
            .filter(s => s.status === 'failed')
            .map((s, index) => ({
              row: index + 1,
              error: s.error || 'Unknown error',
              details: s.error || 'Label creation failed'
            })),
          bulk_label_png_url: data.bulk_label_png_url,
          bulk_label_pdf_url: data.bulk_label_pdf_url,
          uploadStatus: 'success' as const
        };

        console.log('Final updated results:', updatedResults);
        setResults(updatedResults);
        setUploadStatus('success');
        
        toast.success(`Successfully created ${successfulLabels} shipping labels!`);

        if (failedLabels > 0) {
          toast.error(`${failedLabels} labels failed to create. Check details below.`);
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

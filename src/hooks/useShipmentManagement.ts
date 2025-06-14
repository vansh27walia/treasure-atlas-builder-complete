import { useState, useCallback } from 'react';
import { BulkUploadResult, BulkShipment, Rate, LabelFormat, ShipmentDetails, SavedAddress, BatchResult, LabelGenerationProgressUpdate } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';
import { toast } from '@/components/ui/sonner';
// import { processInBatches } from '@/lib/utils'; // Assuming this might be used later or was removed


export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (newResults: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)) => void,
  pickupAddress: SavedAddress | null,
  updateLabelGenerationProgress?: (update: LabelGenerationProgressUpdate) => void,
) => {
  const [isPaying, setIsPaying] = useState(false); // Example state, might be handled elsewhere
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? selectedRate.rate : 0); // rate is already a number
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      successful: updatedShipments.length, // successful is a number
      totalCost // totalCost is a number
    });
    
    toast.success('Shipment removed from list');
  }, [updateResults, results]);

  const handleEditShipment = useCallback((shipmentId: string, updatedDetails: Partial<ShipmentDetails>) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        // Ensure customs_info and options are properly merged if they exist
        const newDetails: ShipmentDetails = {
          ...shipment.details,
          ...updatedDetails,
          to_address: { ...shipment.details.to_address, ...updatedDetails.to_address },
          parcel: { ...shipment.details.parcel, ...updatedDetails.parcel },
        };
        if (updatedDetails.customs_info) {
          newDetails.customs_info = { 
            ...(shipment.details.customs_info || { customs_items: [] }), // Ensure customs_items exists
            ...updatedDetails.customs_info,
            customs_items: updatedDetails.customs_info.customs_items || shipment.details.customs_info?.customs_items || []
          };
        }
        if (updatedDetails.options) {
          newDetails.options = { ...shipment.details.options, ...updatedDetails.options };
        }
        
        return {
          ...shipment,
          details: newDetails,
          // Reset rates as details changed
          availableRates: [],
          selectedRateId: null,
          status: 'pending_rates' as const, 
        };
      }
      return shipment;
    });
    
    // Recalculate total cost as rates might be deselected
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? selectedRate.rate : 0);
    }, 0);

    updateResults({ processedShipments: updatedShipments, totalCost });
    toast.success('Shipment details updated. Please refresh rates.');
  }, [updateResults, results]);

  const handleCreateLabels = useCallback(async () => {
    if (!results || !results.processedShipments || !pickupAddress) {
        toast.error("Cannot create labels: Missing shipment data or pickup address.");
        updateLabelGenerationProgress?.({ isGenerating: false, currentStep: 'Error: Missing data' });
        return;
    }

    setIsCreatingLabels(true);
    const startTime = Date.now();
    updateLabelGenerationProgress?.({ 
        isGenerating: true, 
        currentStep: 'Preparing to create labels...',
        totalShipments: results.processedShipments.filter(s => s.selectedRateId).length,
        processedShipments: 0,
        successfulShipments: 0,
        failedShipments: 0,
        estimatedTimeRemaining: 0, // Initial estimate
    });

    const shipmentsToProcess = results.processedShipments.filter(s => s.selectedRateId && s.status !== 'completed' && s.status !== 'label_purchased');
    
    if (shipmentsToProcess.length === 0) {
        toast.info("No shipments requiring label creation.");
        setIsCreatingLabels(false);
        updateLabelGenerationProgress?.({ isGenerating: false, currentStep: 'No shipments to process.' });
        return;
    }
    
    // ... keep existing code (labelOptions definition)
    const labelOptions = {
        label_format: results.labelFormat || '4x6', // Example, ensure results has this
        label_file_type: results.labelFileType || 'PDF', // Example
        // ... other options
    };

    try {
      updateLabelGenerationProgress?.({ currentStep: `Processing ${shipmentsToProcess.length} shipments...` });
      
      const { data: batchResultData, error: batchError } = await supabase.functions.invoke<BatchResult>(
        'create-enhanced-bulk-labels', // Ensure this function name is correct
        { body: { shipments: shipmentsToProcess, labelOptions, pickupAddressId: pickupAddress.id } } // Corrected: payload wrapped in body
      );

      if (batchError) {
        console.error('Error creating bulk labels:', batchError);
        toast.error(`Label creation failed: ${batchError.message}`);
        updateLabelGenerationProgress?.({ 
            isGenerating: false, 
            currentStep: `Error: ${batchError.message}`,
            failedShipments: shipmentsToProcess.length // Assume all failed if batch fails
        });
        updateResults(prev => ({
            ...(prev as BulkUploadResult),
            processedShipments: prev?.processedShipments.map(s => 
                shipmentsToProcess.find(stp => stp.id === s.id) ? { ...s, status: 'failed', error: batchError.message } : s
            ) || [],
            failed: (prev?.failed || 0) + shipmentsToProcess.length,
            uploadStatus: 'error', // Or keep 'editing' if some succeed but error is general
        }));
        return;
      }

      if (batchResultData) {
        toast.success('Labels created and batch processed successfully!');
        updateResults(prev => {
            const updatedShipments = prev?.processedShipments.map(s => {
                 // Try to find matching shipment in batchResultData if it contains individual shipment statuses
                const processedShipmentInBatch = batchResultData.processedShipments?.find(ps => ps.id === s.id);
                if (processedShipmentInBatch) {
                    return {
                        ...s,
                        status: processedShipmentInBatch.status || 'completed',
                        tracking_code: processedShipmentInBatch.tracking_code || s.tracking_code,
                        tracking_number: processedShipmentInBatch.tracking_number || s.tracking_number,
                        label_url: processedShipmentInBatch.label_url || s.label_url,
                        label_urls: processedShipmentInBatch.label_urls || s.label_urls,
                        error: processedShipmentInBatch.error || null,
                    };
                }
                // If not found in batch result's processed list but was sent, assume completed if no specific error
                if (shipmentsToProcess.find(stp => stp.id === s.id)) {
                     return { ...s, status: 'completed' }; // Default to completed if part of processed batch but not detailed
                }
                return s;
            }) || [];
            
            const successfulCount = updatedShipments.filter(s => s.status === 'completed').length;
            const failedCountInUpdate = updatedShipments.filter(s => s.status === 'failed' || s.status === 'error').length;

            updateLabelGenerationProgress?.({
                isGenerating: false,
                currentStep: 'Label generation complete!',
                processedShipments: shipmentsToProcess.length,
                successfulShipments: successfulCount,
                failedShipments: failedCountInUpdate,
                estimatedTimeRemaining: 0
            });
            
            return {
              ...(prev as BulkUploadResult),
              processedShipments: updatedShipments,
              successful: successfulCount,
              failed: failedCountInUpdate,
              batchResult: batchResultData,
              uploadStatus: 'success',
              totalCost: batchResultData.totalCost || prev?.totalCost, // Update total cost from batch result
              // Keep bulk_label_png_url and bulk_label_pdf_url if they are part of BatchResult or set them
              bulk_label_png_url: batchResultData.consolidatedLabelUrls?.png || prev?.bulk_label_png_url,
              bulk_label_pdf_url: batchResultData.consolidatedLabelUrls?.pdf || prev?.bulk_label_pdf_url,
            };
        });
      }
    } catch (e: any) {
      console.error('Exception during label creation:', e);
      toast.error('An unexpected error occurred during label creation.');
      updateLabelGenerationProgress?.({ isGenerating: false, currentStep: `Exception: ${e.message}` });
      updateResults(prev => ({
        ...(prev as BulkUploadResult),
        uploadStatus: 'error',
        failed: (prev?.failed || 0) + shipmentsToProcess.length,
      }));
    } finally {
      setIsCreatingLabels(false);
      // Final progress update if not already set to !isGenerating
      if (labelGenerationProgress?.isGenerating) {
           updateLabelGenerationProgress?.({ isGenerating: false, estimatedTimeRemaining: 0 });
      }
    }
  }, [results, pickupAddress, updateResults, updateLabelGenerationProgress]);

  const handleDownloadLabelsWithFormat = useCallback(async (format: LabelFormat, batchOrShipmentId?: string, urlOverride?: string) => {
    if (!results) return;
    
    if (batchOrShipmentId) { // Single shipment download
        const shipment = results.processedShipments.find(s => s.id === batchOrShipmentId);
        if (!shipment) {
            toast.error("Shipment not found.");
            return;
        }
        let urlToDownload: string | undefined;
        if (format === 'pdf') urlToDownload = shipment.label_urls?.pdf;
        else if (format === 'png') urlToDownload = shipment.label_urls?.png || shipment.label_url;
        else if (format === 'zpl') urlToDownload = shipment.label_urls?.zpl;
        else if (format === 'epl') urlToDownload = shipment.label_urls?.epl;
        
        if (urlToDownload) {
            // Use existing single label download logic from the hook if available, or implement here
            try {
                const link = document.createElement('a');
                link.href = urlToDownload;
                link.download = `shipping_label_${shipment.id}_${Date.now()}.${format}`;
                link.target = '_blank'; // Open in new tab might be better than direct saveAs for some formats
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Downloaded ${format.toUpperCase()} label for ${shipment.id}`);
            } catch (error) {
                console.error('Download error:', error);
                toast.error('Failed to download label');
            }
        } else {
            toast.error(`${format.toUpperCase()} label not available for ${shipment.id}.`);
        }
        return;
    }

    // Batch download logic (if no shipmentId provided)
    if (!results.batchResult?.consolidatedLabelUrls) {
        // If no batch result, try to generate one (e.g., for PDF)
        if (format === 'pdf' || format === 'zip') { // ZIP implies multiple PNGs, PDF is common batch format
            toast.info(`Generating batch ${format.toUpperCase()}...`);
            const newBatchResult = await handleCreateLabels({ format: format.toUpperCase(), size: '4x6', generateBatch: true });
            if (newBatchResult?.consolidatedLabelUrls?.[format]) {
                 const url = newBatchResult.consolidatedLabelUrls[format]!;
                 window.open(url, '_blank'); // Open in new tab
                 toast.success(`Batch ${format.toUpperCase()} download started.`);
            } else {
                 toast.error(`Failed to generate batch ${format.toUpperCase()}. No URL received.`);
            }
            return;
        } else {
            toast.error(`Batch ${format.toUpperCase()} not available. Try PDF or ZIP (for PNGs).`);
            return;
        }
    }
    
    const url = results.batchResult.consolidatedLabelUrls[format];
    if (url) {
      window.open(url, '_blank'); // Open in new tab
      toast.success(`Batch ${format.toUpperCase()} download started.`);
    } else {
      toast.error(`Batch ${format.toUpperCase()} URL not found.`);
    }
  }, [results, handleCreateLabels]);

  const handleDownloadSingleLabel = useCallback(async (labelUrl: string, format: LabelFormat = 'png', shipmentId?: string) => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${Date.now()}.${format}`;
      link.target = '_blank'; // Open in new tab or trigger download
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Label download started (${format.toUpperCase()})`);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  }, []);

  const handleEmailLabels = useCallback(async (email: string) => {
    if (!results) return;
    
    const shipmentsToEmail = results.processedShipments.filter(s => s.selectedRateId && s.label_url);
    
    if (shipmentsToEmail.length === 0) {
      toast.error('No shipments with generated labels selected to email');
      return;
    }

    toast.info('Emailing labels...');
    try {
        const { data, error } = await supabase.functions.invoke('email-bulk-labels', {
         body: { 
            shipments: shipmentsToEmail.map(s => ({ id: s.id, label_url: s.label_url, tracking_code: s.tracking_code })), 
            email_to: email, 
            pickup_address_details: pickupAddress ? `${pickupAddress.name || ''} - ${pickupAddress.street1}, ${pickupAddress.city}` : 'N/A'
        }
        });
        if (error) throw error;
        toast.success(`Labels emailed successfully to ${email}.`);
    } catch(e: any) {
        toast.error(`Failed to email labels: ${e.message || 'Unknown error'}`);
    }
  }, [results, pickupAddress, supabase.functions]);


  return {
    isPaying,
    isCreatingLabels,
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
  };
};

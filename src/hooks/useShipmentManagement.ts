import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner'; // Corrected from 'sonner'
import { BulkUploadResult, BulkShipment, LabelFormat, SavedAddress, ShipmentDetails, Rate } from '@/types/shipping'; // Added Rate
// import { saveAs } from 'file-saver'; // Assuming file-saver is or can be installed. Keep if used for actual file saving.

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (
    newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)
  ) => void,
  pickupAddress: SavedAddress | null
) => {
  const [isPayingState, setIsPayingState] = useState(false); // Renamed to avoid conflict
  const [isCreatingLabelsState, setIsCreatingLabelsState] = useState(false); // Renamed

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

  const handleCreateLabels = useCallback(async (
    labelOptions: { format: string; size: string; generateBatch?: boolean } = { format: 'PNG', size: '4x6' }
  ) => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address for label creation.');
      return null; // Return null or specific error structure
    }

    setIsCreatingLabelsState(true);
    const shipmentsToProcess = results.processedShipments.filter(s => s.selectedRateId && s.status !== 'completed');

    if (shipmentsToProcess.length === 0) {
      toast.info('No new shipments requiring labels.');
      setIsCreatingLabelsState(false);
      return results.batchResult; // Return existing batch result if any
    }

    try {
      console.log('Creating labels for shipments:', shipmentsToProcess.map(s => s.id));
      console.log('Using pickup address:', pickupAddress.id);
      console.log('Label options:', labelOptions);


      const params = {
        body: {
          shipments: shipmentsToProcess.map(s => ({
            ...s,
            // Ensure from_address is included if not part of shipment.details explicitly
            // The backend function 'create-bulk-labels' might expect from_address per shipment or one for all
            details: {
              ...s.details,
              from_address: s.details.from_address || { // Default to pickupAddress if not on shipment
                name: pickupAddress.name,
                company: pickupAddress.company,
                street1: pickupAddress.street1,
                street2: pickupAddress.street2,
                city: pickupAddress.city,
                state: pickupAddress.state,
                zip: pickupAddress.zip,
                country: pickupAddress.country,
                phone: pickupAddress.phone,
                email: pickupAddress.email,
                is_residential: pickupAddress.address_type === 'residential',
              }
            }
          })),
          // pickupAddressId: pickupAddress.id, // Send ID for backend to fetch if preferred
          labelOptions: labelOptions,
        },
      };
      
      // Ensure supabase types are correct or cast body if necessary
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', params.body);


      if (error) {
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      let newBatchResult = results.batchResult;
      if (data.batchId && data.consolidatedLabelUrls) {
          newBatchResult = {
              batchId: data.batchId,
              consolidatedLabelUrls: data.consolidatedLabelUrls,
              scanFormUrl: data.scanFormUrl || null,
          };
      }


      if ((data.labels && data.labels.length > 0) || newBatchResult?.batchId) {
        const updatedShipments = results.processedShipments.map(shipment => {
          const labelData = data.labels?.find((label: any) => 
            label.shipment_id_internal === shipment.id && // Match by internal ID used in request
            (label.status === 'success' || label.status?.includes('success')) // More robust success check
          );
          
          if (labelData) {
            return {
              ...shipment,
              label_url: labelData.label_urls?.png || labelData.label_url, // Prefer PNG from label_urls
              label_urls: labelData.label_urls || shipment.label_urls,
              tracking_code: labelData.tracking_code || labelData.tracking_number, // Use tracking_code if available
              tracking_number: labelData.tracking_number || shipment.tracking_number,
              status: 'completed' as const,
              // Recipient info might be returned by backend if parsed/validated
              customer_name: labelData.recipient_name || shipment.customer_name, 
              customer_address: labelData.drop_off_address || shipment.details.to_address.street1,
            };
          }
          // If part of a batch but no individual label data, keep existing, status might be 'completed' if batch succeeded
          if (newBatchResult?.batchId && shipmentsToProcess.find(s => s.id === shipment.id)) {
             return { ...shipment, status: 'completed' as const };
          }
          return shipment;
        });

        const successfulLabelsCount = data.labels?.filter((label: any) => 
          label.status === 'success' || label.status?.includes('success')
        ).length || 0;
        
        const failedLabels = data.labels?.filter((label: any) => 
          label.status?.includes('error') || label.status?.includes('fail')
        );

        updateResults(prevResults => ({
          ...prevResults,
          processedShipments: updatedShipments,
          batchResult: newBatchResult, // Update batchResult
          // Keep uploadStatus, it will be updated by parent hook based on overall process
          // successful: (prevResults?.successful || 0) + successfulLabelsCount, // This might double count
          // failed: (prevResults?.failed || 0) + (failedLabels?.length || 0),
        }));

        if (successfulLabelsCount > 0) {
          toast.success(`Successfully created ${successfulLabelsCount} shipping labels.`);
        }
        if (failedLabels && failedLabels.length > 0) {
          console.error('Failed labels:', failedLabels);
          toast.error(`${failedLabels.length} labels failed to create. ${failedLabels[0]?.error || ''}`);
          // Update status of failed shipments
           const shipmentsWithErrors = results.processedShipments.map(ship => {
            const failedLabel = failedLabels.find(fl => fl.shipment_id_internal === ship.id);
            if (failedLabel) {
              return { ...ship, status: 'error' as const, error: failedLabel.error || 'Label creation failed' };
            }
            return ship;
          });
          updateResults({ processedShipments: shipmentsWithErrors });
        }
         return newBatchResult; // Return the batch result
      } else if (!data.labels && !newBatchResult?.batchId) { // Neither individual labels nor batch data
        throw new Error('No labels or batch data were returned from the server.');
      }
      return newBatchResult;
    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
      // Update status of all processed shipments to error if the whole call failed
      const shipmentsWithErrors = results.processedShipments.map(ship => 
        shipmentsToProcess.find(s => s.id === ship.id) 
        ? { ...ship, status: 'error' as const, error: (error instanceof Error ? error.message : 'Label creation failed') } 
        : ship
      );
      updateResults({ processedShipments: shipmentsWithErrors });
      return null;
    } finally {
      setIsCreatingLabelsState(false);
    }
  }, [results, updateResults, pickupAddress, supabase.functions]);


  const handleDownloadLabelsWithFormat = useCallback(async (format: LabelFormat = 'png', shipmentId?: string) => {
    if (!results) return;
    
    if (shipmentId) { // Single shipment download
        const shipment = results.processedShipments.find(s => s.id === shipmentId);
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
  }, [results, pickupAddress, handleCreateLabels]); // Added handleCreateLabels dependency

  const handleDownloadSingleLabel = useCallback(async (labelUrl: string, format: LabelFormat = 'png') => {
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
    isPaying: isPayingState, 
    isCreatingLabels: isCreatingLabelsState,
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
  };
};

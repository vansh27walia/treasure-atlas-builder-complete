import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment, LabelFormat, SavedAddress, ShipmentDetails } from '@/types/shipping';
import { saveAs } from 'file-saver'; // Assuming file-saver is or can be installed

export const useShipmentManagement = (
  results: BulkUploadResult | null,
  updateResults: (
    newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)
  ) => void,
  pickupAddress: SavedAddress | null // pickupAddress is a direct argument
) => {
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost
    });
    
    toast.success('Shipment removed from list');
  }, [updateResults, results]);

  const handleEditShipment = useCallback((shipmentId: string, updatedDetails: Partial<ShipmentDetails>) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        return {
          ...shipment,
          details: {
            ...shipment.details,
            ...updatedDetails,
          },
        };
      }
      return shipment;
    });

    updateResults({ processedShipments: updatedShipments });
    toast.success('Shipment details updated');
  }, [updateResults, results]);

  const handleCreateLabels = useCallback(async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }

    setIsCreatingLabels(true);
    const shipmentsToProcess = results.processedShipments.filter(s => s.selectedRateId);

    if (shipmentsToProcess.length === 0) {
      toast.error('No shipments selected for label creation');
      setIsCreatingLabels(false);
      return;
    }

    try {
      console.log('Creating labels for shipments:', shipmentsToProcess);

      const params = {
        body: {
          shipments: shipmentsToProcess,
          pickupAddress: pickupAddress, // Corrected: use argument
          labelOptions: { format: 'PNG', size: '4x6' },
        },
      };

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', params);

      if (error) {
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      if (data.labels && data.labels.length > 0) {
        // Process the response and update shipments with label URLs
        const updatedShipments = results.processedShipments.map(shipment => {
          const labelData = data.labels.find((label: any) => 
            label.shipment_id === shipment.id && 
            (label.status === 'success_individual_png_saved' || label.status.includes('success'))
          );
          
          if (labelData && labelData.label_urls?.png) {
            return {
              ...shipment,
              label_url: labelData.label_urls.png,
              tracking_code: labelData.tracking_number,
              status: 'completed' as const,
              customer_name: labelData.recipient_name || shipment.customer_name,
              customer_address: labelData.drop_off_address || shipment.customer_address
            };
          }
          return shipment;
        });

        // Count successful labels
        const successfulLabels = data.labels.filter((label: any) => 
          label.status === 'success_individual_png_saved' || 
          label.status.includes('success')
        ).length;

        updateResults({
          processedShipments: updatedShipments,
          bulk_label_png_url: data.bulk_label_png_url,
          bulk_label_pdf_url: data.bulk_label_pdf_url
        });

        toast.success(`Successfully created ${successfulLabels} shipping labels`);

        // Show any failed labels
        const failedLabels = data.labels.filter((label: any) => 
          label.status.includes('error') || label.status.includes('fail')
        );
        
        if (failedLabels.length > 0) {
          console.error('Failed labels:', failedLabels);
          toast.error(`${failedLabels.length} labels failed to create. Check console for details.`);
        }
      } else {
        throw new Error('No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  }, [results, updateResults, pickupAddress]);

  const handleDownloadLabelsWithFormat = useCallback(async (format: LabelFormat = 'png') => {
    if (!results) return;
    
    const labelsToDownload = results.processedShipments.filter(s => s.selectedRateId);
    
    if (labelsToDownload.length === 0) {
      toast.error('No shipments selected for label download');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: labelsToDownload,
          pickupAddress: pickupAddress, // Corrected: use argument
          labelOptions: { format: format.toUpperCase(), size: '4x6', generateBatch: true },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.bulk_label_pdf_url) {
        // Download the bulk PDF
        const link = document.createElement('a');
        link.href = data.bulk_label_pdf_url;
        link.download = `shipping_labels_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Downloaded bulk PDF label');
      } else {
        throw new Error('No bulk PDF label URL received');
      }
    } catch (error) {
      console.error('Error creating bulk label:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create bulk label');
    }
  }, [results, pickupAddress]);

  const handleDownloadSingleLabel = useCallback(async (labelUrl: string, format: LabelFormat = 'png') => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  }, []);

  const handleEmailLabels = useCallback(async (email: string) => {
    if (!results) return;
    
    const shipmentsToEmail = results.processedShipments.filter(s => s.selectedRateId);
    
    if (shipmentsToEmail.length === 0) {
      toast.error('No shipments selected to email');
      return;
    }

    toast.success('Email functionality will be implemented soon');
    // Use the pickupAddress argument if needed for context in email.
    // const { data, error } = await supabase.functions.invoke('email-bulk-labels', {
    //   body: { shipmentsToEmail, email, pickupAddress: pickupAddress }, // Corrected
    // });
    // ...
  }, [results, pickupAddress]);
  

  return {
    isPaying: false, // Placeholder, assuming not implemented yet or elsewhere
    isCreatingLabels: isCreatingLabels, // Placeholder, real state might be more complex
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
  };
};

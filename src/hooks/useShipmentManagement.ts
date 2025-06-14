import { useState, useCallback, useEffect } from 'react';
import { BulkShipment, BulkUploadResult, LabelFormat, Rate, SavedAddress, AddressDetails, ParcelDetails, CustomsInfo } from '@/types/shipping';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { saveAs } from 'file-saver';

export interface LabelOptions {
  format: LabelFormat;
  // Add other label options as needed
}

export interface UseShipmentManagementProps {
  initialShipments?: BulkShipment[];
  onUploadComplete?: (result: BulkUploadResult) => void;
  onRateSelected?: (shipmentId: string, rate: Rate) => void;
  defaultPickupAddress?: SavedAddress | null;
}

export const useShipmentManagement = ({
  initialShipments = [],
  onUploadComplete,
  onRateSelected,
  defaultPickupAddress,
}: UseShipmentManagementProps) => {
  const [shipments, setShipments] = useState<BulkShipment[]>(initialShipments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [currentPickupAddress, setCurrentPickupAddress] = useState<SavedAddress | null>(defaultPickupAddress || null);

  useEffect(() => {
    if (defaultPickupAddress) {
      setCurrentPickupAddress(defaultPickupAddress);
    }
  }, [defaultPickupAddress]);


  const processParsedShipments = useCallback(async (parsedShipments: BulkShipment[], pickupAddressOverride?: SavedAddress | null) => {
    setIsLoading(true);
    setError(null);
    const effectivePickupAddress = pickupAddressOverride || currentPickupAddress;

    if (!effectivePickupAddress && !parsedShipments.every(s => s.details.from_address)) {
        toast.error("Default pickup address is not set. Please set it in settings or ensure all CSV rows have a 'from' address.");
        setIsLoading(false);
        setError("Missing pickup address.");
        return;
    }
    
    console.log('Processing parsed shipments with pickup address:', effectivePickupAddress);

    // Enhance shipments with default pickup address if not provided
    const shipmentsToProcess = parsedShipments.map(shipment => ({
      ...shipment,
      details: {
        ...shipment.details,
        from_address: shipment.details.from_address || effectivePickupAddress as AddressDetails,
      }
    }));
    
    setShipments(shipmentsToProcess); // Update state with potentially modified shipments

    try {
      console.log('Invoking process-bulk-upload with shipments:', shipmentsToProcess);
      const { data, error: funcError } = await supabase.functions.invoke('process-bulk-upload', {
        body: { shipments: shipmentsToProcess }
      });

      if (funcError) throw funcError;
      
      console.log('process-bulk-upload result:', data);
      setUploadResult(data as BulkUploadResult);
      if (onUploadComplete) onUploadComplete(data as BulkUploadResult);
      
      // Update local shipments state with results (e.g., fetched rates)
      if (data && data.processedShipments) {
        setShipments(data.processedShipments);
      }
      toast.success('Shipments processed, rates fetched.');

    } catch (e: any) {
      console.error('Error processing shipments:', e);
      setError(e.message || 'Failed to process shipments.');
      toast.error(`Error: ${e.message || 'Failed to process shipments.'}`);
      setUploadResult(prev => ({
        ...prev,
        total: parsedShipments.length,
        successful: 0,
        failed: parsedShipments.length,
        failedShipments: parsedShipments.map(s => ({ 
            row: s.row_number, 
            shipmentDetails: s.details, 
            error: e.message || 'Processing error' 
        })),
        uploadStatus: 'error',
      } as BulkUploadResult));
    } finally {
      setIsLoading(false);
    }
  }, [currentPickupAddress, onUploadComplete]);

  const updateShipmentStatus = (shipmentId: string, status: BulkShipment['status'], errorMsg?: string) => {
    setShipments(prev =>
      prev.map(s => (s.id === shipmentId ? { ...s, status, error: errorMsg } : s))
    );
  };

  const handleRateSelection = (shipmentId: string, rate: Rate) => {
    setShipments(prevShipments =>
      prevShipments.map(shipment =>
        shipment.id === shipmentId
          ? { ...shipment, selectedRateId: rate.id, status: 'rate_selected', rate: rate.rate, carrier: rate.carrier, service: rate.service }
          : shipment
      )
    );
    if (onRateSelected) {
      onRateSelected(shipmentId, rate);
    }
    toast.info(`Rate selected for shipment ${shipmentId}.`);
  };


  const createLabelsForShipments = useCallback(async (
    shipmentsToLabel: BulkShipment[],
    labelOptions: LabelOptions = { format: 'pdf' }
  ) => {
    setIsLoading(true);
    setError(null);
    toast.loading('Creating labels...');

    const validShipments = shipmentsToLabel.filter(s => s.selectedRateId && s.status === 'rate_selected');

    if (validShipments.length === 0) {
      toast.error('No shipments ready for label creation (rate not selected).');
      setIsLoading(false);
      return null;
    }
    
    console.log('Creating labels for shipments:', validShipments, 'with options:', labelOptions);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('create-bulk-labels', {
        body: { // Corrected: payload wrapped in body
          shipments: validShipments.map(s => ({ // Ensure only necessary data is sent
            id: s.id,
            selectedRateId: s.selectedRateId,
            details: s.details, // Full details might be needed by the backend
            // any other specific fields the backend expects for label creation
          })), 
          labelOptions 
        }
      });

      if (funcError) throw funcError;

      console.log('create-bulk-labels result:', data);
      toast.dismiss();
      toast.success(`${data.successful || 0} labels created successfully. ${data.failed || 0} failed.`);
      
      setUploadResult(prev => ({
        ...prev,
        ...data, // Merge new results, like batchResult, consolidatedLabelUrls
        uploadStatus: data.failed > 0 && data.successful === 0 ? 'error' : 'success',
      } as BulkUploadResult));

      // Update local shipments state with label URLs and tracking codes
      if (data && data.processedShipments) {
         setShipments(prevLocalShipments => {
          const updatedShipments = prevLocalShipments.map(localShipment => {
            const processedVersion = data.processedShipments.find((ps: BulkShipment) => ps.id === localShipment.id);
            return processedVersion ? { ...localShipment, ...processedVersion, status: processedVersion.status || 'completed' } : localShipment;
          });
          return updatedShipments;
        });
      }
      
      if (onUploadComplete && data) onUploadComplete(data as BulkUploadResult);
      return data as BulkUploadResult;

    } catch (e: any) {
      console.error('Error creating labels:', e);
      toast.dismiss();
      setError(e.message || 'Failed to create labels.');
      toast.error(`Label Creation Error: ${e.message || 'Unknown error'}`);
      setUploadResult(prev => ({
        ...prev,
        successful: 0, // Reset successful count if the whole batch call failed
        failed: prev?.failed ? prev.failed + validShipments.length : validShipments.length, // Or adjust based on partial success if possible
        uploadStatus: 'error',
        // Potentially add to failedShipments if context is available
      } as BulkUploadResult));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onUploadComplete]);
  
  const downloadLabel = useCallback(async (url: string, filename: string) => {
    if (!url) {
      toast.error("Label URL is missing, cannot download.");
      return;
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch label: ${response.statusText}`);
      }
      const blob = await response.blob();
      saveAs(blob, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (error: any) {
      console.error("Error downloading label:", error);
      toast.error(`Download failed: ${error.message}`);
    }
  }, []);


  return {
    shipments,
    setShipments,
    isLoading,
    error,
    uploadResult,
    setUploadResult,
    processParsedShipments,
    updateShipmentStatus,
    handleRateSelection,
    createLabelsForShipments,
    downloadLabel,
    currentPickupAddress,
    setCurrentPickupAddress,
  };
};

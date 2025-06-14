
import { useState, useCallback, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BulkShipment, BulkUploadResult, LabelFormat, ShippingOption as UIShippingRate, AddressDetails, SavedAddress, ShipmentDetails } from '@/types/shipping';
import Papa from 'papaparse'; 
import { processCsvData } from '@/utils/bulkUploadUtils'; 
import { useShipmentManagement } from '@/hooks/useShipmentManagement';

export interface LabelGenerationProgressState {
  isGenerating: boolean;
  currentStep: string;
  progress: number; // Overall percentage for Progress component
  totalShipments: number; 
  processedShipments: number; 
  successfulShipments: number;
  failedShipments: number;
  estimatedTimeRemaining?: number;
}

export const useBulkUpload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [shipments, setShipments] = useState<BulkShipment[]>([]); // Raw shipments from CSV
  const [isUploading, setIsUploading] = useState(false); // For CSV parsing phase
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'editing' | 'completed' | 'error'>('idle');
  
  const [results, setResults] = useState<BulkUploadResult | null>(null); // Renamed from uploadResult
  const [progress, setProgress] = useState(0); // For CSV parsing progress
  const [error, setError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null); // Renamed

  const [isFetchingRates, setIsFetchingRates] = useState(false); // Renamed
  const [isCreatingLabels, setIsCreatingLabels] = useState(false); // Renamed
  
  const [labelGenerationProgress, setLabelGenerationProgress] = useState<LabelGenerationProgressState>({
    isGenerating: false,
    currentStep: 'Initializing...',
    progress: 0,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
  });

  // For UI control and data management not directly tied to CSV parsing
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'status' | 'carrier' | 'service' | 'rate' | 'id'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);

  const shipmentManagement = useShipmentManagement({});


  const updateLabelGenerationProgress = useCallback((progressUpdate: Partial<LabelGenerationProgressState>) => {
    setLabelGenerationProgress(prev => ({ ...prev, ...progressUpdate }));
  }, []);
  
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setShipments([]);
    setResults(null);
    setError(null);
    setUploadStatus('idle');
    setProgress(0);
    if (selectedFile) {
      parseAndProcessFile(selectedFile);
    }
  };

  const parseAndProcessFile = async (fileToProcess: File) => {
    setIsUploading(true);
    setUploadStatus('processing');
    setResults(null);
    setProgress(0);
    try {
      const parsedData = await new Promise<any[]>((resolve, reject) => {
        Papa.parse(fileToProcess, {
          header: true,
          skipEmptyLines: true,
          worker: true, // Use worker for better performance
          step: (rowResult, parser) => {
            // Can update progress here if needed, though Papa's complete progress is often enough for smaller files
          },
          complete: (resultsInternal) => {
            setProgress(100);
            if (resultsInternal.errors.length > 0) {
              console.error("CSV parsing errors:", resultsInternal.errors);
              reject(new Error(resultsInternal.errors.map(err => err.message).join(', ')));
            } else {
              resolve(resultsInternal.data);
            }
          },
          error: (err) => {
            reject(err);
          }
        });
      });
      const processedShipmentsFromCsv = processCsvData(parsedData); 
      setShipments(processedShipmentsFromCsv);

      // Mock setting results. In a real app, this would come after a backend call
      // triggered by handleUpload or similar, using processedShipmentsFromCsv and pickupAddress.
      setResults({
        total: processedShipmentsFromCsv.length,
        successful: processedShipmentsFromCsv.length, // Assume all are processable initially
        failed: 0,
        processedShipments: processedShipmentsFromCsv.map(s => ({
          ...s,
          // Ensure necessary fields for display/filtering are present
          recipient: s.details.to_address.name || `TempRecipient-${s.id}`,
          carrier: '', 
          service: '',
          rate: 0, 
          status: 'parsed',
          availableRates: [], // To be populated by a rate fetching call
          selectedRateId: undefined,
        })),
        failedShipments: [],
        totalCost: 0, // Will be calculated after rates are selected
      });
      
      setUploadStatus('editing'); // Move to editing state to show table
      toast({ title: "File Processed", description: "Review shipments and proceed to fetch rates or create labels." });
    } catch (e: any) {
      setError(e.message || "Failed to process file.");
      setUploadStatus('error');
      setResults(null);
      toast({ title: "File Processing Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFetchRatesForAllShipments = useCallback(async () => {
    if (!results?.processedShipments?.length || !pickupAddress) {
      toast({ title: "Missing Data", description: "No shipments or pickup address to fetch rates for.", variant: "destructive" });
      return;
    }
    setIsFetchingRates(true);
    setError(null);
    try {
      // Placeholder: This would call a Supabase function like 'get-bulk-shipping-rates'
      // const { data, error } = await supabase.functions.invoke('get-bulk-shipping-rates', { 
      //   body: { shipments: results.processedShipments, from_address: pickupAddress } 
      // });
      // if (error) throw error;
      // // Update results.processedShipments with rates:
      // const updatedProcessedShipmentsWithRates = results.processedShipments.map(ship => ({
      //   ...ship,
      //   availableRates: data.ratesByShipmentId[ship.id] || [],
      //   selectedRateId: data.ratesByShipmentId[ship.id]?.[0]?.id 
      // }));
      // setResults(prev => prev ? {...prev, processedShipments: updatedProcessedShipmentsWithRates} : null);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      toast({ title: "Rates Fetched (Mock)", description: "Rates updated for all shipments." });
    } catch (e: any) {
      setError(e.message || "Failed to fetch rates for all shipments.");
      toast({ title: "Rate Fetching Error", description: e.message, variant: "destructive" });
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, pickupAddress, toast]);


  const handleCreateLabels = useCallback(async (labelOptions?: { label_format: LabelFormat }) => {
    const shipmentsToProcess = results?.processedShipments?.filter(s => s.selectedRateId && !s.label_url) || [];
    if (!shipmentsToProcess.length) {
      toast({ title: "No Shipments Ready", description: "No shipments with selected rates to create labels for.", variant: "default" });
      return;
    }
    setIsCreatingLabels(true);
    updateLabelGenerationProgress({
      isGenerating: true,
      currentStep: `Starting label generation for ${shipmentsToProcess.length} shipments...`,
      progress: 0,
      totalShipments: shipmentsToProcess.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      estimatedTimeRemaining: shipmentsToProcess.length * 2 // rough estimate in seconds
    });

    try {
      // Placeholder: This would call a Supabase function like 'create-bulk-labels'
      // The function would ideally stream progress back or return detailed results.
      // const labelCreationResult = await shipmentManagement.createLabelsForShipments(shipmentsToProcess, labelOptions);
      // if (!labelCreationResult) throw new Error("Label creation failed at management layer.");
      
      // Mocking progress and result
      for (let i = 0; i < shipmentsToProcess.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work for each label
        updateLabelGenerationProgress({
          processedShipments: i + 1,
          successfulShipments: i + 1, // Assuming success for mock
          progress: ((i + 1) / shipmentsToProcess.length) * 100,
          currentStep: `Generating label ${i+1} of ${shipmentsToProcess.length}...`
        });
      }
      
      const finalProcessedShipments = results!.processedShipments!.map(s => {
        if (shipmentsToProcess.find(stp => stp.id === s.id)) {
          return { ...s, label_url: `mock_label_${s.id}.pdf`, tracking_code: `MOCKTRACK${s.id}`, status: 'completed' as const };
        }
        return s;
      });
      setResults(prev => prev ? ({...prev, processedShipments: finalProcessedShipments, uploadStatus: 'success' as const}) : null);
      
      updateLabelGenerationProgress({
        isGenerating: false,
        currentStep: `Label generation complete.`,
        // progress: 100, (already set)
        // processedShipments: shipmentsToProcess.length, (already set)
        // successfulShipments: shipmentsToProcess.length, (already set)
        estimatedTimeRemaining: 0
      });
      toast({ title: "Label Creation Complete (Mock)", description: `Processed ${shipmentsToProcess.length} labels.` });
      setUploadStatus('completed');
    } catch (e: any) {
      setError(e.message || "Failed to create labels.");
      updateLabelGenerationProgress({ isGenerating: false, currentStep: `Error: ${e.message}`, failedShipments: shipmentsToProcess.length, estimatedTimeRemaining: 0 });
      toast({ title: "Label Creation Error", description: e.message, variant: "destructive" });
    } finally {
      setIsCreatingLabels(false);
    }
  }, [results, toast, shipmentManagement, updateLabelGenerationProgress]);

  const handlePreviewLabel = (shipmentId: string, labelUrl?: string) => {
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment && (labelUrl || shipment.label_url)) {
      window.open(labelUrl || shipment.label_url, '_blank');
      toast({ title: "Previewing Label", description: `Opening label for shipment ${shipmentId}.`});
    } else {
      toast({ title: "Cannot Preview", description: "Label URL not available for this shipment.", variant: "default" });
    }
  };
  
  const handleDownloadAllLabels = async (documentType: "batch" | "pickup_manifest" | "archive" = "archive", format: LabelFormat = 'pdf') => {
    toast({ title: "Download All (Mock)", description: `Preparing to download all labels as ${documentType} in ${format} format.`});
    // Actual implementation would involve zipping files or generating a batch PDF.
  };

  const isPaying = false; // Mock, should be based on payment flow state

  const handleRemoveShipment = (shipmentId: string) => { 
    if (!results || !results.processedShipments) return;
    const updatedProcessedShipments = results.processedShipments.filter(s => s.id !== shipmentId);
    const totalCost = updatedProcessedShipments.reduce((sum, s) => sum + (s.rate || 0), 0);
    setResults(prev => prev ? ({
      ...prev,
      processedShipments: updatedProcessedShipments,
      total: updatedProcessedShipments.length,
      successful: updatedProcessedShipments.filter(s => s.status === 'completed' || s.selectedRateId).length, // Adjust success criteria
      totalCost,
    }) : null);
    setShipments(prev => prev.filter(s => s.id !== shipmentId)); // Also update raw shipments if necessary
    toast({ title: "Shipment Removed", description: `Shipment ${shipmentId} removed.` });
  };

  const handleEditShipment = (shipmentId: string, newDetails: Partial<ShipmentDetails>) => {
    console.log("Attempting to edit shipment:", shipmentId, newDetails);
    let found = false;
    if (results && results.processedShipments) {
      const updatedProcessedShipments = results.processedShipments.map(s => {
        if (s.id === shipmentId) {
          found = true;
          // Merge details carefully. Ensure to_address and parcel are correctly updated.
          const updatedShipmentDetails: ShipmentDetails = {
            ...s.details,
            ...newDetails,
            to_address: { ...s.details.to_address, ...(newDetails.to_address || {}) },
            parcel: { ...s.details.parcel, ...(newDetails.parcel || {}) },
          };
          return { ...s, details: updatedShipmentDetails };
        }
        return s;
      });
      if (found) {
        setResults(prevResults => prevResults ? ({ ...prevResults, processedShipments: updatedProcessedShipments }) : null);
        toast({ title: "Shipment Updated", description: `Details for shipment ${shipmentId} updated.` });
      } else {
        toast({ title: "Update Failed", description: `Shipment ${shipmentId} not found in processed list.`, variant: "destructive"});
      }
    }
     // Also update local `shipments` if it's still relevant
    setShipments(prev => prev.map(s => {
        if (s.id === shipmentId) {
           const updatedShipmentDetails: ShipmentDetails = {
            ...s.details,
            ...newDetails,
            to_address: { ...s.details.to_address, ...(newDetails.to_address || {}) },
            parcel: { ...s.details.parcel, ...(newDetails.parcel || {}) },
          };
          return { ...s, details: updatedShipmentDetails };
        }
        return s;
      }));
  };
  
  const handleDownloadLabelsWithFormat = (format: LabelFormat, batchId?: string) => { // Added batchId
    toast({ title: "Download Format (Mock)", description: `Format ${format} selected.`});
    // Call handleDownloadAllLabels or specific logic
  };

  const handleDownloadSingleLabel = async (url: string, format: LabelFormat, shipmentId?: string ) => { // Added shipmentId
    const link = document.createElement('a');
    link.href = url;
    link.download = `label_${shipmentId || 'download'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Label Downloaded", description: `Label for ${shipmentId} downloaded as ${format}.` });
  };
  
  const handleEmailLabels = (email: string) => { 
    toast({ title: "Email Labels (Mock)", description: `Would email to ${email}.`});
  };

  const filteredShipments = useMemo(() => {
    let shipmentsToFilter = results?.processedShipments || [];
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      shipmentsToFilter = shipmentsToFilter.filter(shipment =>
        (shipment.recipient?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (shipment.carrier?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (shipment.id?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (shipment.details.to_address.street1?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (shipment.details.to_address.city?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (shipment.details.to_address.zip?.toLowerCase() || '').includes(lowerSearchTerm)
      );
    }
    if (selectedCarrierFilter) {
      shipmentsToFilter = shipmentsToFilter.filter(shipment => shipment.carrier === selectedCarrierFilter);
    }

    return [...shipmentsToFilter].sort((a, b) => {
        let aValue: string | number = '';
        let bValue: string | number = '';
        switch (sortField) {
            case 'recipient': aValue = a.recipient || ''; bValue = b.recipient || ''; break;
            case 'status': aValue = a.status || ''; bValue = b.status || ''; break;
            case 'carrier': aValue = a.carrier || ''; bValue = b.carrier || ''; break;
            case 'service': aValue = a.service || ''; bValue = b.service || ''; break;
            case 'id': aValue = a.id || ''; bValue = b.id || ''; break;
            case 'rate': aValue = typeof a.rate === 'string' ? parseFloat(a.rate) : (a.rate || 0);
                         bValue = typeof b.rate === 'string' ? parseFloat(b.rate) : (b.rate || 0); break;
            default: return 0;
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [results?.processedShipments, searchTerm, selectedCarrierFilter, sortField, sortDirection]);

  // Placeholder handlers for BulkUpload.tsx
  const handleUpload = async () => {
    // This should be triggered after file parsing if a separate upload step is needed.
    // For now, parseAndProcessFile handles parsing and mock-setting results.
    // If 'process-bulk-upload' Supabase function is used, call it here with `shipments` and `pickupAddress`.
    // Example:
    // if (!shipments.length || !pickupAddress) {
    //   toast({ title: "Missing data", description: "Cannot upload without shipments and pickup address.", variant: "destructive"});
    //   return;
    // }
    // setIsUploading(true); // A different kind of uploading (to backend)
    // try {
    //   const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
    //     body: { shipments: shipments.map(s=>s.details), from_address: pickupAddress } // Adjust payload as needed
    //   });
    //   if (error) throw error;
    //   setResults(data as BulkUploadResult); // Assuming data is BulkUploadResult
    //   setUploadStatus('editing');
    //   toast({ title: "Upload Successful", description: "Shipments processed by backend."});
    // } catch (e: any) {
    //   setError(e.message || "Backend processing failed.");
    //   setUploadStatus('error');
    //   toast({ title: "Upload Error", description: e.message, variant: "destructive"});
    // } finally {
    //   setIsUploading(false);
    // }
    toast({ title: "Upload Action", description: "This action would send parsed data to the backend."});
  };

  const handleDownloadTemplate = () => {
    const csvHeader = "recipient_name,recipient_company,recipient_street1,recipient_street2,recipient_city,recipient_state,recipient_zip,recipient_country,recipient_phone,recipient_email,parcel_length,parcel_width,parcel_height,parcel_weight\n";
    const exampleRow = "John Doe,Doe Corp,123 Main St,,Anytown,CA,90210,US,555-1234,john.doe@example.com,10,8,6,2\n";
    const csvContent = csvHeader + exampleRow;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_shipment_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Template Downloaded", description: "CSV template has been downloaded." });
  };

  const handleSelectRate = (shipmentId: string, rateId: string, selectedRateDetails: UIShippingRate) => {
    if (!results || !results.processedShipments) return;

    const updatedProcessedShipments = results.processedShipments.map(s => {
      if (s.id === shipmentId) {
        return { 
          ...s, 
          selectedRateId: rateId,
          // Assuming selectedRateDetails contains all necessary fields like carrier, service, rate
          carrier: selectedRateDetails.carrier,
          service: selectedRateDetails.service,
          rate: parseFloat(selectedRateDetails.rate), // Ensure rate is stored as number
          status: 'rate_selected' as const,
        };
      }
      return s;
    });

    const totalCost = updatedProcessedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate && shipment.selectedRateId ? Number(shipment.rate) : 0);
    }, 0);

    setResults(prevResults => prevResults ? ({ 
      ...prevResults, 
      processedShipments: updatedProcessedShipments,
      totalCost 
    }) : null);
    toast({ title: "Rate Selected", description: `Rate applied to shipment ${shipmentId}.` });
  };

  const handleRefreshRates = async (shipmentId: string) => {
    toast({ title: "Refresh Rates (Mock)", description: `Refreshing rates for shipment ${shipmentId}.`});
    // Find the shipment, clear its availableRates and selectedRateId
    // Then call a Supabase function to get new rates for this single shipment
    // Then update results.processedShipments with new availableRates.
  };

  const handleBulkApplyCarrier = (carrier: string) => {
     if (!results || !results.processedShipments) return;
    let appliedCount = 0;
    const updatedProcessedShipments = results.processedShipments.map(shipment => {
        const carrierRate = shipment.availableRates?.find(rate => rate.carrier === carrier);
        if (carrierRate) {
            appliedCount++;
            return {
                ...shipment,
                selectedRateId: carrierRate.id,
                carrier: carrierRate.carrier,
                service: carrierRate.service,
                rate: parseFloat(carrierRate.rate),
                status: 'rate_selected' as const,
            };
        }
        return shipment;
    });
    if (appliedCount > 0) {
        const totalCost = updatedProcessedShipments.reduce((sum, shipment) => {
            return sum + (shipment.rate && shipment.selectedRateId ? Number(shipment.rate) : 0);
        }, 0);
        setResults(prevResults => prevResults ? ({ ...prevResults, processedShipments: updatedProcessedShipments, totalCost }) : null);
        toast.success(`Applied ${carrier} to ${appliedCount} shipments.`);
    } else {
        toast.info(`No shipments found that could apply ${carrier}. Ensure rates are fetched.`);
    }
  };
  
  const handleOpenBatchPrintPreview = () => {
    if (results?.processedShipments?.some(s => s.label_url || s.label_urls) || results?.batchResult) {
      setBatchPrintPreviewModalOpen(true);
    } else {
      toast({title: "No Labels", description: "No labels available for batch preview.", variant: "default"});
    }
  };

  return {
    file,
    shipments: results?.processedShipments || [], // Provide processed shipments primarily
    setShipments: (newShipments) => { // Allow external setting, though primarily managed internally
        if(results) setResults({...results, processedShipments: newShipments});
        else setResults({ processedShipments: newShipments, total: newShipments.length, successful:0, failed:0, failedShipments: [], totalCost:0});
    },
    isUploading, // CSV parsing isUploading
    uploadStatus,
    results, // Main data object for the UI
    setResults, 
    progress, // CSV parsing progress
    error,
    setError, 
    handleFileChange,
    pickupAddress, // Renamed
    setPickupAddress, // Renamed

    isFetchingRates, // Renamed
    isCreatingLabels, // Renamed
    labelGenerationProgress, // Updated structure
    updateLabelGenerationProgress,
    handleFetchRatesForAllShipments, 
    handleCreateLabels, // Renamed

    handlePreviewLabel,
    handleDownloadAllLabels,

    isPaying, 
    handleRemoveShipment, 
    handleEditShipment, // Updated signature
    handleDownloadLabelsWithFormat, 
    handleDownloadSingleLabel, 
    handleEmailLabels,
    
    // Added from CoreHook expectations
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    selectedCarrierFilter,
    setSelectedCarrierFilter,
    filteredShipments, // Implemented
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleUpload, // Implemented placeholder
    handleDownloadTemplate, // Implemented
    handleSelectRate, // Implemented
    handleRefreshRates, // Implemented placeholder
    handleBulkApplyCarrier, // Implemented
    handleOpenBatchPrintPreview, // Implemented
  };
};

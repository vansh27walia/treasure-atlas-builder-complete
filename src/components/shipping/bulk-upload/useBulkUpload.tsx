
import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { processCsvData } from '@/utils/bulkUploadUtils';
import { useShipmentManagement } from '@/hooks/useShipmentManagement';
import { BulkShipment, BulkUploadResult, LabelFormat, ShippingOption, AddressDetails, SavedAddress, ShipmentDetails, Rate, BulkShipmentStatus } from '@/types/shipping';
import type { BulkShipmentFilterField } from './BulkShipmentFilters';

export interface LabelGenerationProgressState {
  isGenerating: boolean;
  currentStep: string;
  progress: number; 
  totalShipments: number;
  processedShipments: number;
  successfulShipments: number;
  failedShipments: number;
  estimatedTimeRemaining?: number;
}

export const useBulkUpload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [rawParsedShipments, setRawParsedShipments] = useState<BulkShipment[]>([]); 
  const [isUploading, setIsUploading] = useState(false); 
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'editing' | 'completed' | 'error'>('idle');
  
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0); 
  const [error, setError] = useState<string | null>(null);
  
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);

  const [isFetchingRates, setIsFetchingRates] = useState(false);
  
  const [labelGenerationProgress, setLabelGenerationProgress] = useState<LabelGenerationProgressState>({
    isGenerating: false,
    currentStep: 'Initializing...',
    progress: 0,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<BulkShipmentFilterField>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);

  const shipmentManagement = useShipmentManagement({});

  const updateLabelGenerationProgress = useCallback((progressUpdate: Partial<LabelGenerationProgressState>) => {
    setLabelGenerationProgress(prev => ({ ...prev, ...progressUpdate }));
  }, []);
  
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setRawParsedShipments([]);
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
          worker: true, 
          step: (rowResult, parser) => {
            // Can update progress here
          },
          complete: (papaResults) => {
            setProgress(100);
            if (papaResults.errors.length > 0) {
              console.error("CSV parsing errors:", papaResults.errors);
              reject(new Error(papaResults.errors.map(err => err.message).join(', ')));
            } else {
              resolve(papaResults.data);
            }
          },
          error: (err) => {
            reject(err);
          }
        });
      });
      const processedShipmentsFromCsv = processCsvData(parsedData);
      setRawParsedShipments(processedShipmentsFromCsv);

      setResults({
        total: processedShipmentsFromCsv.length,
        successful: 0,
        failed: 0,
        processedShipments: processedShipmentsFromCsv.map(s => ({
          ...s,
          recipient: s.details.to_address.name || `TempRecipient-${s.id}`,
          carrier: '', 
          service: '',
          rate: 0, 
          status: 'parsed' as BulkShipmentStatus,
          availableRates: [],
          selectedRateId: undefined,
        })),
        failedShipments: [],
        totalCost: 0,
      });
      
      setUploadStatus('editing'); 
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
    updateLabelGenerationProgress({
      isGenerating: true,
      currentStep: `Fetching rates for ${results.processedShipments.length} shipments...`,
      progress: 0,
      totalShipments: results.processedShipments.length,
      processedShipments:0
    });

    try {
      await new Promise(resolve => setTimeout(resolve, 1500 + results.processedShipments.length * 50)); 

      const updatedProcessedShipments = results.processedShipments.map((ship, index) => {
        const mockRates: Rate[] = [
          { id: `${ship.id}-rate1`, carrier: 'MockCarrierA', service: 'Standard', rate: parseFloat((Math.random() * 10 + 5).toFixed(2)), currency: 'USD', shipment_id: ship.id },
          { id: `${ship.id}-rate2`, carrier: 'MockCarrierB', service: 'Express', rate: parseFloat((Math.random() * 20 + 10).toFixed(2)), currency: 'USD', shipment_id: ship.id },
        ];
        updateLabelGenerationProgress({
            processedShipments: index + 1,
            progress: ((index + 1) / results.processedShipments.length) * 100,
            currentStep: `Fetched rates for shipment ${index + 1} of ${results.processedShipments.length}...`
        });
        return {
          ...ship,
          availableRates: mockRates,
          selectedRateId: mockRates[0]?.id,
          carrier: mockRates[0]?.carrier || ship.carrier,
          service: mockRates[0]?.service || ship.service,
          rate: mockRates[0]?.rate || ship.rate,
          status: mockRates.length > 0 ? 'rates_fetched' : ship.status,
        } as BulkShipment;
      });
      
      const totalCost = updatedProcessedShipments.reduce((sum, s) => sum + (s.rate && s.selectedRateId ? Number(s.rate) : 0), 0);

      setResults(prev => prev ? ({
          ...prev, 
          processedShipments: updatedProcessedShipments, 
          totalCost,
          uploadStatus: 'editing'
        }) : null);
      
      updateLabelGenerationProgress({
        isGenerating: false,
        currentStep: "Rate fetching complete.",
        estimatedTimeRemaining: 0
      });
      toast({ title: "Rates Fetched (Mock)", description: "Rates updated for all shipments." });
    } catch (e: any) {
      setError(e.message || "Failed to fetch rates for all shipments.");
      updateLabelGenerationProgress({ isGenerating: false, currentStep: `Error fetching rates: ${e.message}` });
      toast({ title: "Rate Fetching Error", description: e.message, variant: "destructive" });
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, pickupAddress, toast, updateLabelGenerationProgress]);

  const handleCreateLabels = useCallback(async (labelOptions?: { label_format: LabelFormat }) => {
    const shipmentsToProcess = results?.processedShipments?.filter(s => s.selectedRateId && s.status !== 'completed' && !s.label_url) || [];
    if (!shipmentsToProcess.length) {
      toast({ title: "No Shipments Ready", description: "No shipments with selected rates to create labels for.", variant: "default" });
      return;
    }
    
    updateLabelGenerationProgress({
      isGenerating: true,
      currentStep: `Starting label generation for ${shipmentsToProcess.length} shipments...`,
      progress: 0,
      totalShipments: shipmentsToProcess.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      estimatedTimeRemaining: shipmentsToProcess.length * 2 
    });

    try {
      let newSuccessfulShipments = 0;
      let newFailedShipments = 0;

      const processedShipmentsPromises = shipmentsToProcess.map(async (shipment, index) => {
        try {
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          
          const isSuccess = Math.random() > 0.1;
          
          let updatedShipment = { ...shipment };
          if (isSuccess) {
            updatedShipment = {
              ...shipment,
              label_url: `mock_label_${shipment.id}.${labelOptions?.label_format || 'pdf'}`,
              tracking_code: `MOCKTRACK${shipment.id}`,
              status: 'completed' as const,
              label_urls: { [labelOptions?.label_format || 'pdf']: `mock_label_${shipment.id}.${labelOptions?.label_format || 'pdf'}` }
            };
            newSuccessfulShipments++;
          } else {
            updatedShipment = {
              ...shipment,
              status: 'failed' as const,
              error: 'Mock label creation failed for this shipment.'
            };
            newFailedShipments++;
          }
          
          updateLabelGenerationProgress({
            processedShipments: index + 1,
            successfulShipments: newSuccessfulShipments,
            failedShipments: newFailedShipments,
            progress: ((index + 1) / shipmentsToProcess.length) * 100,
            currentStep: `Generating label ${index + 1} of ${shipmentsToProcess.length}...`
          });
          return updatedShipment;
        } catch (shipmentError: any) {
          newFailedShipments++;
          updateLabelGenerationProgress({
             processedShipments: index + 1,
             failedShipments: newFailedShipments,
             progress: ((index + 1) / shipmentsToProcess.length) * 100,
             currentStep: `Error on label ${index + 1}: ${shipmentError.message}`
          });
          return { ...shipment, status: 'failed' as const, error: shipmentError.message };
        }
      });

      const individualResults = await Promise.all(processedShipmentsPromises);
      
      const finalProcessedShipments = results!.processedShipments!.map(s => {
        const processedVersion = individualResults.find(ir => ir.id === s.id);
        return processedVersion || s;
      });
      
      setResults(prev => prev ? ({
        ...prev, 
        processedShipments: finalProcessedShipments, 
        successful: (prev.successful || 0) + newSuccessfulShipments,
        failed: (prev.failed || 0) + newFailedShipments,
        uploadStatus: (prev.failed || 0) + newFailedShipments > 0 ? 'editing' : 'completed'
      }) : null);
      
      updateLabelGenerationProgress({
        isGenerating: false,
        currentStep: `Label generation complete. Successful: ${newSuccessfulShipments}, Failed: ${newFailedShipments}.`,
        estimatedTimeRemaining: 0
      });

      toast({ title: "Label Creation Attempted", description: `Successfully created ${newSuccessfulShipments} labels. ${newFailedShipments} failed.` });
      if (newFailedShipments === 0 && newSuccessfulShipments > 0) {
        setUploadStatus('completed');
      } else {
        setUploadStatus('editing');
      }

    } catch (e: any) {
      setError(e.message || "Failed to create labels.");
      updateLabelGenerationProgress({ isGenerating: false, currentStep: `Error: ${e.message}`, failedShipments: shipmentsToProcess.length, estimatedTimeRemaining: 0 });
      toast({ title: "Label Creation Error", description: e.message, variant: "destructive" });
      setUploadStatus('error');
    }
  }, [results, toast, shipmentManagement, updateLabelGenerationProgress]);

  const handlePreviewLabel = (shipmentId: string, labelUrl?: string) => {
    const shipment = results?.processedShipments?.find(s => s.id === shipmentId);
    if (shipment && (labelUrl || shipment.label_url)) {
      window.open(labelUrl || shipment.label_url!, '_blank');
      toast({ title: "Previewing Label", description: `Opening label for shipment ${shipmentId}.`});
    } else {
      toast({ title: "Cannot Preview", description: "Label URL not available for this shipment.", variant: "default" });
    }
  };
  
  const handleDownloadAllLabels = async (documentType: "batch" | "pickup_manifest" | "archive" = "archive", format: LabelFormat = 'pdf') => {
    toast({ title: "Download All (Mock)", description: `Preparing to download all labels as ${documentType} in ${format} format.`});
    const labelsToDownload = results?.processedShipments?.filter(s => s.label_url);
    if (!labelsToDownload || labelsToDownload.length === 0) {
      toast({ title: "No Labels", description: "No labels available for download.", variant: "default" });
      return;
    }
    labelsToDownload.forEach(shipment => {
      if (shipment.label_url) {
         handleDownloadSingleLabel(shipment.label_url, format, shipment.id);
      }
    });
  };

  const isPaying = false; 

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results || !results.processedShipments) return;
    const updatedProcessedShipments = results.processedShipments.filter(s => s.id !== shipmentId);
    const totalCost = updatedProcessedShipments.reduce((sum, s) => sum + (s.rate || 0), 0);
    
    const updatedRawParsedShipments = rawParsedShipments.filter(s => s.id !== shipmentId);
    setRawParsedShipments(updatedRawParsedShipments);

    setResults(prev => prev ? ({
      ...prev,
      processedShipments: updatedProcessedShipments,
      total: updatedProcessedShipments.length,
      successful: updatedProcessedShipments.filter(s => s.status === 'completed' || (s.selectedRateId && s.status !== 'failed' && s.status !== 'error')).length,
      totalCost,
    }) : null);
    toast({ title: "Shipment Removed", description: `Shipment ${shipmentId} removed.` });
  };

  const handleEditShipment = (shipmentId: string, newDetails: Partial<ShipmentDetails>) => {
    console.log("Attempting to edit shipment:", shipmentId, newDetails);
    let foundInProcessed = false;
    if (results && results.processedShipments) {
      const updatedProcessedShipments = results.processedShipments.map(s => {
        if (s.id === shipmentId) {
          foundInProcessed = true;
          const updatedShipmentDetails: ShipmentDetails = {
            ...s.details,
            ...newDetails,
            to_address: { ...s.details.to_address, ...(newDetails.to_address || {}) },
            parcel: { ...s.details.parcel, ...(newDetails.parcel || {}) },
          };
          return { 
            ...s, 
            details: updatedShipmentDetails,
            recipient: newDetails.to_address?.name || s.details.to_address.name,
            status: 'parsed' as BulkShipmentStatus, 
            availableRates: [],
            selectedRateId: undefined,
            rate: 0,
            carrier: '',
            service: '',
          };
        }
        return s;
      });
      if (foundInProcessed) {
        setResults(prevResults => prevResults ? ({ ...prevResults, processedShipments: updatedProcessedShipments }) : null);
        toast({ title: "Shipment Updated", description: `Details for shipment ${shipmentId} updated. Rates need to be re-fetched.` });
      } else {
        toast({ title: "Update Failed", description: `Shipment ${shipmentId} not found in processed list.`, variant: "destructive"});
      }
    }
    
    setRawParsedShipments(prevRaw => prevRaw.map(s => {
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
  
  const handleDownloadLabelsWithFormat = (format: LabelFormat, batchId?: string) => {
    toast({ title: "Download Format (Mock)", description: `Format ${format} selected for batch ${batchId || 'all available'}.`});
    handleDownloadAllLabels("archive", format);
  };

  const handleDownloadSingleLabel = async (url: string, format: LabelFormat, shipmentId?: string ) => {
    if (!url) {
      toast({ title: "Download Error", description: "No label URL provided.", variant: "destructive"});
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = `label_${shipmentId || 'download'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Label Downloaded", description: `Label for ${shipmentId || 'shipment'} downloaded as ${format}.` });
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
            case 'carrier': aValue = a.carrier || ''; bValue = b.carrier || ''; break;
            case 'rate': 
                aValue = typeof a.rate === 'string' ? parseFloat(a.rate) : (a.rate || 0);
                bValue = typeof b.rate === 'string' ? parseFloat(b.rate) : (b.rate || 0); 
                break;
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

  const handleUpload = async () => {
    toast({ title: "Upload Action", description: "This action would send parsed data to the backend. File parsing is now client-side."});
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

  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results || !results.processedShipments) return;

    const shipmentToUpdate = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipmentToUpdate || !shipmentToUpdate.availableRates) {
        toast({ title: "Error", description: `Shipment ${shipmentId} or its rates not found.`, variant: "destructive"});
        return;
    }
    
    const selectedRateDetails = shipmentToUpdate.availableRates.find(r => r.id === rateId);
    if (!selectedRateDetails) {
        toast({ title: "Error", description: `Rate ${rateId} not found for shipment ${shipmentId}.`, variant: "destructive"});
        return;
    }

    const updatedProcessedShipments = results.processedShipments.map(s => {
      if (s.id === shipmentId) {
        return { 
          ...s, 
          selectedRateId: rateId,
          carrier: selectedRateDetails.carrier,
          service: selectedRateDetails.service,
          rate: parseFloat(String(selectedRateDetails.rate)), 
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
    if (!results || !pickupAddress) {
        toast({title: "Cannot Refresh", description: "Shipment data or pickup address missing.", variant: "destructive"});
        return;
    }
    const shipmentToRefresh = results.processedShipments.find(s => s.id === shipmentId);
    if (!shipmentToRefresh) {
        toast({title: "Shipment Not Found", variant: "destructive"});
        return;
    }
    
    setIsFetchingRates(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockRates: Rate[] = [
        { id: `${shipmentId}-newrate1`, carrier: 'MockCarrierC', service: 'Refreshed Standard', rate: parseFloat((Math.random() * 12 + 6).toFixed(2)), currency: 'USD', shipment_id: shipmentId },
        { id: `${shipmentId}-newrate2`, carrier: 'MockCarrierD', service: 'Refreshed Express', rate: parseFloat((Math.random() * 22 + 12).toFixed(2)), currency: 'USD', shipment_id: shipmentId },
    ];

    const updatedProcessedShipments = results.processedShipments.map(s => {
        if (s.id === shipmentId) {
            return {
                ...s,
                availableRates: mockRates,
                selectedRateId: undefined,
                carrier: '',
                service: '',
                rate: 0,
                status: 'rates_fetched' as const,
            };
        }
        return s;
    });

    setResults(prev => prev ? ({ ...prev, processedShipments: updatedProcessedShipments }) : null);
    setIsFetchingRates(false);
    toast({ title: "Rates Refreshed", description: `New rates available for shipment ${shipmentId}.` });
  };

  const handleBulkApplyCarrier = async (carrier: string) => {
    if (!results?.processedShipments?.length) {
        toast({ title: "No Shipments", description: "No shipments available to apply carrier to.", variant: "default" });
        return;
    }
    
    const updatedProcessedShipments = results.processedShipments.map(s => {
        const carrierRate = s.availableRates?.find(r => r.carrier === carrier);
        if (carrierRate) {
            return {
                ...s,
                selectedRateId: carrierRate.id,
                carrier: carrierRate.carrier,
                service: carrierRate.service,
                rate: carrierRate.rate,
                status: 'rate_selected' as const,
            };
        }
        return s;
    });

    const totalCost = updatedProcessedShipments.reduce((sum, s) => sum + (s.rate && s.selectedRateId ? Number(s.rate) : 0), 0);

    setResults(prev => prev ? ({ ...prev, processedShipments: updatedProcessedShipments, totalCost }) : null);
    toast({ title: "Carrier Applied", description: `${carrier} applied to all compatible shipments.` });
  };

  const handleOpenBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  return {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleFileChange,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setPickupAddress,
    updateLabelGenerationProgress,
    handleFetchRatesForAllShipments,
    error,
    isPaying,
  };
};

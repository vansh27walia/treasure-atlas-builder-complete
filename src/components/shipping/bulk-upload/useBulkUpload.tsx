import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { SavedAddress } from '@/services/AddressService';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export const useBulkUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error' | 'editing' | 'creating-labels'>('idle');
  const [results, setResults] = useState<BulkUploadResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'carrier' | 'rate'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  
  // CSV mapping related state
  const [csvContent, setCsvContent] = useState<string>('');
  const [showCsvMapper, setShowCsvMapper] = useState(false);
  
  const [labelGenerationProgress, setLabelGenerationProgress] = useState({
    isGenerating: false,
    totalShipments: 0,
    processedShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
    currentStep: '',
    estimatedTimeRemaining: 0
  });

  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);

  // Filtered shipments based on search and filters
  const filteredShipments = results?.processedShipments?.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.details?.to_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.details?.to_company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = !selectedCarrierFilter || 
      shipment.selectedRate?.carrier === selectedCarrierFilter;
    
    return matchesSearch && matchesCarrier;
  }) || [];

  const handleUpload = useCallback(async (uploadedFile: File) => {
    try {
      console.log('Starting upload process for file:', uploadedFile.name);
      setFile(uploadedFile);
      setIsUploading(true);
      setUploadStatus('uploading');
      setProgress(0);

      if (!pickupAddress) {
        throw new Error('Please select a pickup address before uploading');
      }

      // Read file content
      console.log('Reading file content...');
      const fileContent = await uploadedFile.text();
      console.log('File content read, length:', fileContent.length);
      console.log('First 200 chars:', fileContent.substring(0, 200));
      
      setCsvContent(fileContent);
      setProgress(25);

      // Check if we need AI header mapping
      const lines = fileContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('CSV file appears to be empty');
      }

      const firstLine = lines[0];
      const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('Detected headers:', headers);
      
      // Check if headers match our expected template exactly
      const expectedHeaders = ['to_name', 'to_company', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country', 'to_phone', 'weight', 'length', 'width', 'height'];
      const hasExactMatch = expectedHeaders.every(expected => 
        headers.some(header => header.toLowerCase() === expected.toLowerCase())
      );

      console.log('Has exact header match:', hasExactMatch);
      setProgress(50);

      if (!hasExactMatch) {
        // Show AI mapper for non-exact matches
        console.log('Headers do not match template exactly, showing AI mapper');
        setIsUploading(false);
        setUploadStatus('editing'); // Set to editing to show progress tracker
        setShowCsvMapper(true);
        setProgress(75); // Show some progress while waiting for mapping
        return;
      }

      // Process the file directly if headers match exactly
      console.log('Headers match exactly, processing directly');
      await processUploadedFile(fileContent);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
      setIsUploading(false);
      setProgress(0);
    }
  }, [pickupAddress]);

  const processUploadedFile = useCallback(async (content: string) => {
    try {
      console.log('Processing uploaded file and fetching rates...');
      setProgress(75);
      setIsFetchingRates(true);
      
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: content,
          pickupAddress: pickupAddress 
        }
      });

      if (error) {
        console.error('Process bulk upload error:', error);
        throw error;
      }

      console.log('Successfully processed shipments with rates:', data);
      setProgress(100);
      setResults(data);
      setUploadStatus('editing');
      setIsFetchingRates(false);
      
      toast.success(`Successfully processed ${data.processedShipments?.length || 0} shipments with rates`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process upload and fetch rates');
      setUploadStatus('error');
      setIsFetchingRates(false);
    } finally {
      setIsUploading(false);
    }
  }, [pickupAddress]);

  const handleCsvMappingComplete = useCallback(async (convertedCsv: string) => {
    try {
      console.log('CSV mapping completed, processing converted CSV...');
      console.log('Converted CSV preview:', convertedCsv.substring(0, 200));
      
      setShowCsvMapper(false);
      setIsUploading(true);
      setUploadStatus('uploading');
      
      // Process the converted CSV and fetch rates
      await processUploadedFile(convertedCsv);
    } catch (error) {
      console.error('Error in handleCsvMappingComplete:', error);
      toast.error('Failed to process converted CSV');
      setUploadStatus('error');
      setIsUploading(false);
    }
  }, [processUploadedFile]);

  const handleCancelCsvMapping = useCallback(() => {
    console.log('CSV mapping cancelled, resetting to idle state');
    setShowCsvMapper(false);
    setUploadStatus('idle');
    setFile(null);
    setCsvContent('');
    setProgress(0);
  }, []);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    if (!results?.processedShipments) return;

    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.rates?.find(rate => rate.id === rateId);
        return {
          ...shipment,
          selectedRateId: rateId,
          selectedRate
        };
      }
      return shipment;
    });

    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: updatedShipments.reduce((sum, shipment) => {
        return sum + (shipment.selectedRate?.rate || 0);
      }, 0)
    });
  }, [results]);

  const handleRemoveShipment = useCallback((shipmentId: string) => {
    if (!results?.processedShipments) return;

    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );

    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: updatedShipments.reduce((sum, shipment) => {
        return sum + (shipment.selectedRate?.rate || 0);
      }, 0)
    });

    toast.success('Shipment removed');
  }, [results]);

  const handleEditShipment = useCallback((updatedShipment: BulkShipment) => {
    if (!results?.processedShipments) return;

    const updatedShipments = results.processedShipments.map(shipment =>
      shipment.id === updatedShipment.id ? updatedShipment : shipment
    );

    setResults({
      ...results,
      processedShipments: updatedShipments
    });

    toast.success('Shipment updated');
  }, [results]);

  const handleCreateLabels = useCallback(async () => {
    try {
      if (!results?.processedShipments) {
        throw new Error('No shipments to process');
      }

      setIsCreatingLabels(true);
      setLabelGenerationProgress({
        isGenerating: true,
        totalShipments: results.processedShipments.length,
        processedShipments: 0,
        successfulShipments: 0,
        failedShipments: 0,
        currentStep: 'Initializing label creation...',
        estimatedTimeRemaining: 0
      });

      const shipmentsWithRates = results.processedShipments.filter(
        shipment => shipment.selectedRateId && shipment.easypost_id
      );

      if (shipmentsWithRates.length === 0) {
        throw new Error('No shipments have selected rates');
      }

      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: shipmentsWithRates,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) throw error;

      // Update results with the processed labels
      setResults(prevResults => ({
        ...prevResults!,
        processedShipments: data.processedLabels,
        batchResult: data.batchResult
      }));

      setUploadStatus('success');
      toast.success(`Successfully created ${data.successful} labels`);

    } catch (error) {
      console.error('Label creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
      setLabelGenerationProgress(prev => ({ ...prev, isGenerating: false }));
    }
  }, [results]);

  const handleDownloadAllLabels = useCallback(() => {
    if (!results?.processedShipments) return;
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    // Download each label individually with staggered timing
    labelsWithUrls.forEach((shipment, index) => {
      setTimeout(() => {
        handleDownloadSingleLabel(shipment.label_url!);
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} labels`);
  }, [results]);

  const handleDownloadLabelsWithFormat = useCallback(async (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results) return;
    
    if (format === 'pdf' && results.batchResult?.consolidatedLabelUrls?.pdf) {
      // Download bulk PDF
      handleDownloadSingleLabel(results.batchResult.consolidatedLabelUrls.pdf);
      toast.success('Downloaded bulk PDF label');
      return;
    }
    
    const labelsWithUrls = results.processedShipments?.filter(s => s.label_url) || [];
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    labelsWithUrls.forEach((shipment, index) => {
      setTimeout(() => {
        handleDownloadSingleLabel(shipment.label_url!);
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
  }, [results]);

  const handleClearBatchError = useCallback(() => {
    setBatchError(null);
  }, []);

  const handleDownloadSingleLabel = useCallback((url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.click();
  }, []);

  const handleEmailLabels = useCallback(async (emailData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-shipping-labels', {
        body: emailData
      });

      if (error) throw error;

      toast.success('Labels sent successfully!');
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send labels');
    }
  }, []);

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = 'to_name,to_company,to_street1,to_city,to_state,to_zip,to_country,to_phone,weight,length,width,height\n' +
      'John Doe,Example Corp,123 Main St,Anytown,CA,12345,US,555-0123,1,10,8,6';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shipping_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRefreshRates = useCallback(() => {
    // Implement rate refresh logic if needed
    toast.info('Refreshing rates...');
  }, []);

  const handleBulkApplyCarrier = useCallback((carrier: string) => {
    // Implement bulk carrier application logic if needed
    toast.info(`Applying ${carrier} to all shipments...`);
  }, []);

  return {
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    batchError,
    labelGenerationProgress,
    batchPrintPreviewModalOpen,
    csvContent,
    showCsvMapper,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleClearBatchError,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    handleCsvMappingComplete,
    handleCancelCsvMapping,
    handleRefreshRates,
    handleBulkApplyCarrier,
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    setBatchPrintPreviewModalOpen
  };
};

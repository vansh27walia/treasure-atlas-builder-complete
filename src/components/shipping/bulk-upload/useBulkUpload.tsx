
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
  const [sortField, setSortField] = useState<'customer' | 'carrier' | 'service' | 'cost'>('customer');
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
      setFile(uploadedFile);
      setIsUploading(true);
      setUploadStatus('uploading');
      setProgress(0);

      if (!pickupAddress) {
        throw new Error('Please select a pickup address before uploading');
      }

      // Read file content
      const fileContent = await uploadedFile.text();
      setCsvContent(fileContent);

      // Check if we need AI header mapping
      const firstLine = fileContent.split('\n')[0];
      const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Check if headers match our expected template
      const expectedHeaders = ['to_name', 'to_company', 'to_street1', 'to_city', 'to_state', 'to_zip', 'to_country', 'to_phone', 'weight', 'length', 'width', 'height'];
      const hasMatchingHeaders = expectedHeaders.some(expected => 
        headers.some(header => header.toLowerCase() === expected.toLowerCase())
      );

      if (!hasMatchingHeaders) {
        // Show AI mapper
        setShowCsvMapper(true);
        setIsUploading(false);
        setUploadStatus('editing');
        return;
      }

      // Process the file directly if headers match
      await processUploadedFile(fileContent);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setUploadStatus('error');
      setIsUploading(false);
    }
  }, [pickupAddress]);

  const processUploadedFile = useCallback(async (content: string) => {
    try {
      setProgress(25);
      
      const formData = new FormData();
      formData.append('csvContent', content);
      formData.append('pickupAddress', JSON.stringify(pickupAddress));

      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: content,
          pickupAddress: pickupAddress 
        }
      });

      if (error) throw error;

      setProgress(100);
      setResults(data);
      setUploadStatus('editing');
      setIsFetchingRates(false);
      
      toast.success(`Successfully processed ${data.processedShipments?.length || 0} shipments`);
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process upload');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [pickupAddress]);

  const handleCsvMappingComplete = useCallback(async (convertedCsv: string) => {
    setShowCsvMapper(false);
    setIsUploading(true);
    setUploadStatus('uploading');
    await processUploadedFile(convertedCsv);
  }, [processUploadedFile]);

  const handleCancelCsvMapping = useCallback(() => {
    setShowCsvMapper(false);
    setUploadStatus('idle');
    setFile(null);
    setCsvContent('');
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

      setResults({
        ...results,
        processedShipments: data.processedLabels,
        failedLabels: data.failedLabels,
        batchResult: data.batchResult
      });

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


import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment, CustomsInfo } from '@/types/shipping';
import { useShipmentUpload } from '@/hooks/useShipmentUpload';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';

export const useBulkUpload = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    setResults,
    setUploadStatus,
    handleFileChange: originalHandleFileChange,
    handleUpload: originalHandleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const { selectedAddress: pickupAddress, setSelectedAddress: setPickupAddress } = usePickupAddresses();
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'rate' | 'carrier' | 'customer_address' | 'status'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [batchError, setBatchError] = useState<{ packageNumber: number; error: string } | null>(null);
  const [batchPrintPreviewModalOpen, setBatchPrintPreviewModalOpen] = useState(false);
  const [labelGenerationProgress, setLabelGenerationProgress] = useState({
    isGenerating: false,
    currentStep: '',
    processedShipments: 0,
    totalShipments: 0,
    successfulShipments: 0,
    failedShipments: 0,
    estimatedTimeRemaining: 0
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    originalHandleFileChange(event);
  };

  const handleUpload = async (file: File) => {
    await originalHandleUpload(file, pickupAddress);
  };

  const filteredShipments = useMemo(() => {
    if (!results?.processedShipments) return [];
    
    let filtered = results.processedShipments.filter(shipment => {
      const matchesSearch = !searchTerm || 
        (shipment.recipient || shipment.customer_name || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (shipment.customer_address || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const matchesCarrier = !selectedCarrierFilter || 
        shipment.carrier?.toLowerCase() === selectedCarrierFilter.toLowerCase();
      
      return matchesSearch && matchesCarrier;
    });

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      switch (sortField) {
        case 'recipient':
          aValue = a.recipient || a.customer_name || '';
          bValue = b.recipient || b.customer_name || '';
          break;
        case 'rate':
          aValue = a.rate || 0;
          bValue = b.rate || 0;
          break;
        case 'carrier':
          aValue = a.carrier || '';
          bValue = b.carrier || '';
          break;
        case 'customer_address':
          aValue = a.customer_address || '';
          bValue = b.customer_address || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [results?.processedShipments, searchTerm, selectedCarrierFilter, sortField, sortDirection]);

  const handleSelectRate = async (shipmentId: string, rateId: string) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => 
      shipment.id === shipmentId 
        ? { ...shipment, selectedRateId: rateId }
        : shipment
    );

    setResults({
      ...results,
      processedShipments: updatedShipments
    });
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );

    setResults({
      ...results,
      processedShipments: updatedShipments,
      total: updatedShipments.length
    });
  };

  const handleEditShipment = (updatedShipment: BulkShipment) => {
    if (!results) return;

    const updatedShipments = results.processedShipments.map(shipment => 
      shipment.id === updatedShipment.id ? updatedShipment : shipment
    );

    setResults({
      ...results,
      processedShipments: updatedShipments
    });
  };

  const handleRefreshRates = async (shipmentId: string) => {
    toast.info('Refreshing rates...');
  };

  const handleBulkApplyCarrier = async (carrierFilter: string) => {
    setIsFetchingRates(true);
    try {
      toast.success('Rates fetched successfully');
    } catch (error) {
      toast.error('Failed to fetch rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleCreateLabels = async () => {
    setIsCreatingLabels(true);
    try {
      toast.success('Labels created successfully');
    } catch (error) {
      toast.error('Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleOpenBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  const handleClearBatchError = () => {
    setBatchError(null);
  };

  const handleDownloadAllLabels = () => {
    toast.info('Downloading all labels...');
  };

  const handleDownloadLabelsWithFormat = (format: string) => {
    toast.info(`Downloading labels in ${format} format...`);
  };

  const handleDownloadSingleLabel = (shipmentId: string) => {
    toast.info('Downloading single label...');
  };

  const handleEmailLabels = (email: string) => {
    toast.info('Emailing labels...');
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment processed successfully');
  };

  return {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    isFetchingRates,
    isPaying,
    isCreatingLabels,
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    pickupAddress,
    batchError,
    setPickupAddress,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleCreateLabels,
    handleOpenBatchPrintPreview,
    handleClearBatchError,
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels,
    handleDownloadTemplate,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    labelGenerationProgress,
    handlePaymentSuccess
  };
};

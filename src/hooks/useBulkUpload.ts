
import { useState, useEffect } from 'react';
import { useShipmentUpload } from './useShipmentUpload';
import { useShipmentManagement } from './useShipmentManagement';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { addressService, SavedAddress } from '@/services/AddressService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useBulkUpload = () => {
  const {
    file,
    isUploading,
    uploadStatus,
    results,
    progress,
    // ✅ The fix is here! setResults is correctly imported and used below.
    setResults, 
    setUploadStatus,
    handleFileChange,
    handleUpload,
    handleDownloadTemplate
  } = useShipmentUpload();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'carrier' | 'rate'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [batchError, setBatchError] = useState<{ packageNumber: number; error: string } | null>(null);
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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Load default pickup address
  useEffect(() => {
    const loadDefaultAddress = async () => {
      try {
        const address = await addressService.getDefaultFromAddress();
        if (address) {
          setPickupAddress(address);
        }
      } catch (error) {
        console.error('Error loading default pickup address:', error);
      }
    };
    loadDefaultAddress();
  }, []);

  // Auto-trigger label creation after payment completion
  useEffect(() => {
    if (paymentCompleted && !isCreatingLabels && results && results.processedShipments.length > 0) {
      console.log('Payment completed, auto-starting label creation...');
      handleCreateLabels();
      setPaymentCompleted(false); // Reset flag
    }
  }, [paymentCompleted, isCreatingLabels, results]);

  // Filter and sort shipments
  const filteredShipments = results?.processedShipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrier = !selectedCarrierFilter || 
      shipment.carrier === selectedCarrierFilter;
    
    return matchesSearch && matchesCarrier;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortField) {
      case 'recipient':
        aValue = a.recipient;
        bValue = b.recipient;
        break;
      case 'carrier':
        aValue = a.carrier;
        bValue = b.carrier;
        break;
      case 'rate':
        aValue = a.rate;
        bValue = b.rate;
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        if (selectedRate) {
          const updatedShipment = {
            ...shipment,
            selectedRateId: rateId,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            rate: Number(selectedRate.rate)
          };
          
          const insuranceEnabled = updatedShipment.details?.insurance_enabled !== false;
          const declaredValue = updatedShipment.details?.declared_value || 0;
          updatedShipment.insurance_cost = insuranceEnabled && declaredValue > 0 
            ? Math.max(declaredValue * 0.02, 1) 
            : 0;
          
          return updatedShipment;
        }
      }
      return shipment;
    });
    
    const totalShippingCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    const grandTotal = updatedShipments.reduce((sum, shipment) => {
      const rowTotal = (shipment.rate || 0) + (shipment.insurance_cost || 0);
      return sum + rowTotal;
    }, 0);
    
    // ✅ Correctly using the setResults setter from the child hook.
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost
    });
  };

  const handleRemoveShipment = (shipmentId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.filter(
      shipment => shipment.id !== shipmentId
    );
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsurance = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    // ✅ Correctly using the setResults setter from the child hook.
    setResults({
      ...results,
      processedShipments: updatedShipments,
      successful: updatedShipments.length,
      totalCost,
      totalInsurance
    });
    
    toast.success('Shipment removed from list');
  };

  const handleEditShipment = (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) {
      toast.error('No shipments available to edit');
      return;
    }
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const updatedShipment = { ...shipment, ...updates };
        
        // Recalculate insurance cost
        const insuranceEnabled = updatedShipment.details?.insurance_enabled !== false;
        const declaredValue = updatedShipment.details?.declared_value || 0;
        updatedShipment.insurance_cost = insuranceEnabled && declaredValue > 0 
          ? Math.max(declaredValue * 0.02, 1) 
          : 0;
        
        return updatedShipment;
      }
      return shipment;
    });
    
    const totalShippingCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    // ✅ Correctly using the setResults setter from the child hook.
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost
    });
    
    toast.success('✅ Changes saved locally! Fetching new rates...');
    
    // Auto-refresh rates after a brief delay
    setTimeout(() => {
      handleRefreshRates(shipmentId);
    }, 1500); 
  };

  const handleRefreshRates = async (shipmentId: string) => {
    try {
      setIsFetchingRates(true);
      if (!results) return;
      const target = results.processedShipments.find(s => s.id === shipmentId);
      if (!target) return;

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { shipment: target.details }
      });
      if (error) throw error;

      const updatedShipments: BulkShipment[] = results.processedShipments.map(s =>
        s.id === shipmentId
          ? ({ ...s, availableRates: (data?.rates || []), status: 'rates_fetched' as BulkShipment['status'] })
          : s
      );

      setResults({ ...results, processedShipments: updatedShipments });
      toast.success('Rates refreshed');
    } catch (e) {
      console.error('Refresh rates error:', e);
      toast.error('Failed to refresh rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleBulkApplyCarrier = (carrier: string) => {
    if (!results) return;
    const updated = results.processedShipments.map(s => {
      const r = s.availableRates?.find(ar => ar.carrier === carrier);
      if (!r) return s;
      return {
        ...s,
        selectedRateId: r.id,
        carrier: r.carrier,
        service: r.service,
        rate: Number(r.rate)
      };
    });
    const totalCost = updated.reduce((sum, s) => sum + (s.rate || 0), 0);
    const totalInsurance = updated.reduce((sum, s) => sum + (s.insurance_cost || 0), 0);
    setResults({ ...results, processedShipments: updated, totalCost, totalInsurance });
    toast.success(`Applied ${carrier} to matching shipments`);
  };

  const handleClearBatchError = () => {
    setBatchError(null);
  };

  const handleOpenBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentCompleted(true);
    toast.success('Payment successful');
  };

  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  const handleCreateLabels = async () => {
    if (!results) return;
    setIsCreatingLabels(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: { shipments: results.processedShipments, pickupAddress }
      });
      if (error) throw error;

      const updated = results.processedShipments.map(s => {
        const ns = data?.processedLabels?.find((x: any) => x.id === s.id);
        return ns ? { ...s, ...ns } : s;
      });

      setResults({ ...results, processedShipments: updated, uploadStatus: 'success' });
      toast.success('Labels created');
    } catch (e) {
      console.error('Create labels error:', e);
      toast.error('Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handleDownloadAllLabels = () => {
    if (!results) return;
    results.processedShipments.forEach(s => {
      if (s.label_url) {
        window.open(s.label_url, '_blank');
      }
    });
  };

  const handleDownloadLabelsWithFormat = async (format: string) => {
    await handleCreateLabels();
    handleDownloadAllLabels();
  };

  const handleDownloadSingleLabel = (shipmentId: string) => {
    if (!results) return;
    const s = results.processedShipments.find(x => x.id === shipmentId);
    if (s?.label_url) {
      window.open(s.label_url, '_blank');
    } else {
      toast.error('Label not available for this shipment');
    }
  };

  const handleEmailLabels = async (email: string) => {
    if (!results) return;
    try {
      const { error } = await supabase.functions.invoke('email-labels', {
        body: { shipments: results.processedShipments, email, type: 'bulk_domestic' }
      });
      if (error) throw error;
      toast.success(`Labels emailed to ${email}`);
    } catch (e) {
      console.error('Email labels error:', e);
      toast.error('Failed to email labels');
    }
  };

  return {
    // ... exposed values and setters
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
    setBatchPrintPreviewModalOpen,
    showAddPaymentModal,
    setShowAddPaymentModal,
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    handleFileChange,
    handleUpload,
    handleSelectRate,
    handleRemoveShipment,
    handleEditShipment,
    handleRefreshRates,
    handleBulkApplyCarrier,
    handleClearBatchError,
    handleOpenBatchPrintPreview,
    handlePaymentSuccess,
    handleAddPaymentMethod,
    handleDownloadTemplate,
    handleCreateLabels,
    handleDownloadAllLabels,
    handleDownloadLabelsWithFormat,
    handleDownloadSingleLabel,
    handleEmailLabels
  };
};

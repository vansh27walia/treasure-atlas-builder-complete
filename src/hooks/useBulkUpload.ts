
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
  const [advancedFilters, setAdvancedFilters] = useState({
    minPrice: 0,
    maxPrice: 100,
    maxDays: 7,
    features: [] as string[]
  });
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

  // Filter and sort shipments with advanced filters
  const filteredShipments = results?.processedShipments.filter(shipment => {
    // Basic search filter
    const matchesSearch = !searchTerm || 
      shipment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.service?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Carrier filter
    const matchesCarrier = !selectedCarrierFilter || 
      shipment.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase();
    
    // Advanced price filter
    const rate = Number(shipment.rate || 0);
    const matchesPrice = rate >= advancedFilters.minPrice && rate <= advancedFilters.maxPrice;
    
    // Advanced delivery days filter
    const selectedRate = shipment.availableRates?.find(r => r.id === shipment.selectedRateId);
    const deliveryDays = selectedRate?.delivery_days || 99;
    const matchesDays = deliveryDays <= advancedFilters.maxDays;
    
    // Advanced features filter
    const service = shipment.service?.toLowerCase() || '';
    const matchesFeatures = advancedFilters.features.length === 0 || 
      advancedFilters.features.some(feature => service.includes(feature.toLowerCase()));
    
    return matchesSearch && matchesCarrier && matchesPrice && matchesDays && matchesFeatures;
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

  const handleEditShipment = async (shipmentId: string, updates: Partial<BulkShipment>) => {
    if (!results) {
      toast.error('No shipments available to edit');
      return;
    }
    
    console.log('🔄 Processing shipment edit for ID:', shipmentId);
    console.log('📝 Updates received:', updates);
    
    // Update shipment in local state immediately
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const updatedShipment = { ...shipment, ...updates };
        
        // Recalculate insurance cost using updated values
        const insuranceEnabled = updatedShipment.details?.insurance_enabled !== false;
        const declaredValue = updatedShipment.details?.declared_value || 0;
        updatedShipment.insurance_cost = insuranceEnabled && declaredValue > 0 
          ? Math.max(declaredValue * 0.02, 1) 
          : 0;
        
        console.log('💰 Insurance calculation - Enabled:', insuranceEnabled, 'Value:', declaredValue, 'Cost:', updatedShipment.insurance_cost);
        
        return updatedShipment;
      }
      return shipment;
    });
    
    // Recalculate totals
    const totalShippingCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    // Update state immediately
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost
    });
    
    console.log('✅ Shipment updated in state, now refreshing rates...');
    
    // Refresh rates immediately with updated data
    try {
      await handleRefreshRates(shipmentId);
    } catch (error) {
      console.error('❌ Failed to refresh rates after edit:', error);
      toast.error('Shipment saved but failed to refresh rates. Try the Refresh button.');
    }
  };

  const handleRefreshRates = async (shipmentId: string) => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipment data or pickup address');
      return;
    }

    try {
      setIsFetchingRates(true);
      console.log('🔄 Refreshing rates for shipment:', shipmentId);
      
      const target = results.processedShipments.find(s => s.id === shipmentId);
      if (!target) {
        toast.error('Shipment not found');
        return;
      }

      // Build proper payload using updated shipment data and pickup address
      const fromAddress = {
        name: pickupAddress.name || pickupAddress.company || 'Sender',
        company: pickupAddress.company || '',
        street1: pickupAddress.street1,
        street2: pickupAddress.street2 || '',
        city: pickupAddress.city,
        state: pickupAddress.state,
        zip: pickupAddress.zip,
        country: pickupAddress.country || 'US',
        phone: pickupAddress.phone || ''
      };

      const toAddress = {
        name: target.recipient || target.customer_name || 'Recipient',
        company: target.company || '',
        street1: typeof target.customer_address === 'object' && target.customer_address?.street1 
          ? target.customer_address.street1 
          : target.details?.to_street1 || '',
        street2: typeof target.customer_address === 'object' && target.customer_address?.street2 
          ? target.customer_address.street2 
          : target.details?.to_street2 || '',
        city: typeof target.customer_address === 'object' && target.customer_address?.city 
          ? target.customer_address.city 
          : target.details?.to_city || '',
        state: typeof target.customer_address === 'object' && target.customer_address?.state 
          ? target.customer_address.state 
          : target.details?.to_state || '',
        zip: typeof target.customer_address === 'object' && target.customer_address?.zip 
          ? target.customer_address.zip 
          : target.details?.to_zip || '',
        country: target.country || target.details?.to_country || 'US',
        phone: target.phone || target.customer_phone || target.details?.to_phone || ''
      };

      const parcel = {
        weight: target.weight || target.details?.weight || 1,
        length: target.length || target.details?.length || 1,
        width: target.width || target.details?.width || 1,
        height: target.height || target.details?.height || 1
      };

      const payload = {
        fromAddress,
        toAddress,
        parcel,
        declaredValue: target.declared_value || target.details?.declared_value || 0
      };

      console.log('📤 Sending rate request with payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) throw error;

      console.log('📥 Received rates:', data?.rates?.length || 0, 'rates');

      const updatedShipments: BulkShipment[] = results.processedShipments.map(s =>
        s.id === shipmentId
          ? ({
              ...s,
              availableRates: (data?.rates || []),
              // Reset selection so user picks from fresh rates
              selectedRateId: null,
              carrier: '',
              service: '',
              rate: 0,
              easypost_id: null,
              status: 'rates_fetched' as BulkShipment['status']
            })
          : s
      );

      setResults({ ...results, processedShipments: updatedShipments });
      toast.success(`✅ Found ${data?.rates?.length || 0} rates for updated shipment`);
      
    } catch (e) {
      console.error('❌ Refresh rates error:', e);
      toast.error('Failed to refresh rates: ' + (e as Error).message);
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
    advancedFilters,
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
    setAdvancedFilters,
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
    handleEmailLabels,
    setResults
  };
};

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
            rate: parseFloat(selectedRate.rate)
          };
          
          // Ensure insurance cost is calculated based on current settings
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
    
    // ENHANCED: Calculate totals correctly - sum of all row totals
    const totalShippingCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    // The final total for payment is the sum of all individual row totals
    const grandTotal = updatedShipments.reduce((sum, shipment) => {
      const rowTotal = (shipment.rate || 0) + (shipment.insurance_cost || 0);
      return sum + rowTotal;
    }, 0);
    
    console.log('Rate selection - Row-by-row totals calculation:', {
      totalShippingCost,
      totalInsuranceCost,
      grandTotal,
      verification: `${totalShippingCost} + ${totalInsuranceCost} = ${grandTotal}`,
      rowBreakdown: updatedShipments.map(s => ({ 
        id: s.id, 
        rate: s.rate || 0, 
        insurance: s.insurance_cost || 0,
        rowTotal: (s.rate || 0) + (s.insurance_cost || 0)
      }))
    });
    
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
    
    // FIXED: Recalculate totals after removal
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsurance = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
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
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const updatedShipment = { ...shipment, ...updates };
        
        // Validate FedEx phone number requirement
        if (updatedShipment.carrier?.toLowerCase().includes('fedex') && 
            !updatedShipment.details?.phone_number?.trim()) {
          toast.error('FedEx shipments require a phone number');
          return shipment; // Return unchanged if validation fails
        }
        
        // Check for international customs requirements
        const isInternational = updatedShipment.details?.to_country !== 'US' && 
                              updatedShipment.details?.to_country !== 'USA';
        if (isInternational) {
          toast.warning('International shipment - ensure customs documents are complete');
        }
        
        // Ensure insurance cost is properly calculated
        const insuranceEnabled = updatedShipment.details?.insurance_enabled !== false;
        const declaredValue = updatedShipment.details?.declared_value || 0;
        
        // Always recalculate insurance cost based on current settings
        updatedShipment.insurance_cost = insuranceEnabled && declaredValue > 0 
          ? Math.max(declaredValue * 0.02, 1) 
          : 0;
        
        return updatedShipment;
      }
      return shipment;
    });
    
    // ENHANCED: Recalculate all totals properly - sum of row totals
    const totalShippingCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    // Calculate grand total (sum of all row totals)
    const grandTotal = updatedShipments.reduce((sum, shipment) => {
      const rowTotal = (shipment.rate || 0) + (shipment.insurance_cost || 0);
      return sum + rowTotal;
    }, 0);
    
    console.log('Edit shipment - Row-by-row recalculation:', {
      shipmentId,
      updates,
      totalShippingCost,
      totalInsuranceCost,
      grandTotal,
      verification: `${totalShippingCost} + ${totalInsuranceCost} = ${grandTotal}`,
      updatedShipment: updatedShipments.find(s => s.id === shipmentId)
    });
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost
    });
    
    toast.success('Shipment updated successfully');
    
    // Automatically fetch new rates for the edited shipment
    console.log('Auto-fetching new rates for edited shipment:', shipmentId);
    setTimeout(() => {
      handleRefreshRates(shipmentId);
    }, 500); // Small delay to ensure state is updated
  };

  const handleRefreshRates = async (shipmentId: string) => {
    if (!results || !pickupAddress) return;
    
    setIsFetchingRates(true);
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
      toast.error('Shipment not found');
      setIsFetchingRates(false);
      return;
    }

    try {
      console.log('Fetching new rates for edited shipment:', shipmentId);
      
      // Create a temporary CSV content for this single shipment
      const csvHeader = 'to_name,to_street1,to_city,to_state,to_zip,to_country,weight,length,width,height,to_company,to_street2,to_phone,to_email,reference';
      const csvRow = `"${shipment.details?.to_name || shipment.recipient}","${shipment.details?.to_street1 || ''}","${shipment.details?.to_city || ''}","${shipment.details?.to_state || ''}","${shipment.details?.to_zip || ''}","${shipment.details?.to_country || 'US'}","${shipment.details?.weight || 1}","${shipment.details?.length || 1}","${shipment.details?.width || 1}","${shipment.details?.height || 1}","${shipment.details?.to_company || ''}","${shipment.details?.to_street2 || ''}","${shipment.details?.phone_number || ''}","${shipment.details?.to_email || ''}","${shipment.details?.reference || ''}"`;
      
      const csvContent = `${csvHeader}\n${csvRow}`;

      // Use the same edge function as initial upload
      const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
        body: { 
          csvContent: csvContent,
          pickupAddress: pickupAddress
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.processedShipments && data.processedShipments.length > 0) {
        const updatedShipmentData = data.processedShipments[0];
        
        // Update the specific shipment with new rates
        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s,
              availableRates: updatedShipmentData.availableRates,
              // Reset selected rate since we have new options
              selectedRateId: undefined,
              carrier: '',
              service: '',
              rate: 0
            };
          }
          return s;
        });

        // Recalculate totals
        const totalCost = updatedShipments.reduce((sum, shipment) => {
          return sum + (shipment.rate || 0);
        }, 0);
        
        const totalInsurance = updatedShipments.reduce((sum, shipment) => {
          return sum + (shipment.insurance_cost || 0);
        }, 0);

        setResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost,
          totalInsurance
        });

        toast.success('New rates fetched successfully! Please select a rate.');
      } else {
        throw new Error('No rates received from updated shipment data');
      }

    } catch (error) {
      console.error('Error fetching new rates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch new rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleBulkApplyCarrier = (carrier: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      const carrierRate = shipment.availableRates?.find(rate => rate.carrier === carrier);
      if (carrierRate) {
        return {
          ...shipment,
          selectedRateId: carrierRate.id,
          carrier: carrierRate.carrier,
          service: carrierRate.service,
          rate: parseFloat(carrierRate.rate)
        };
      }
      return shipment;
    });
    
    // FIXED: Recalculate totals after bulk apply
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    const totalInsurance = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.insurance_cost || 0);
    }, 0);
    
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost,
      totalInsurance
    });
    
    toast.success(`Applied ${carrier} to all applicable shipments`);
  };

  const handleClearBatchError = () => {
    setBatchError(null);
  };

  const handleOpenBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  // Handle showing the add payment method modal
  const handleAddPaymentMethod = () => {
    setShowAddPaymentModal(true);
  };

  // FIXED: Enhanced payment success handler with proper total validation
  const handlePaymentSuccess = () => {
    console.log('Payment successful, triggering label creation...');
    
    // Verify payment amount matches calculated total
    if (results) {
      const calculatedShippingTotal = results.processedShipments.reduce((sum, shipment) => {
        return sum + (shipment.rate || 0);
      }, 0);
      const calculatedInsuranceTotal = results.processedShipments.reduce((sum, shipment) => {
        return sum + (shipment.insurance_cost || 0);
      }, 0);
      const calculatedFinalTotal = calculatedShippingTotal + calculatedInsuranceTotal;
      console.log('Payment completed for total amount:', {
        shipping: calculatedShippingTotal,
        insurance: calculatedInsuranceTotal,
        final: calculatedFinalTotal
      });
    }
    
    setIsPaying(false);
    setPaymentCompleted(true);
    toast.success('Payment successful! Creating labels automatically...');
  };

  // Direct label creation without payment prompts
  const handleCreateLabels = async () => {
    if (!results || !pickupAddress) {
      toast.error('Missing shipments or pickup address');
      return;
    }
    
    setIsCreatingLabels(true);
    setLabelGenerationProgress({
      isGenerating: true,
      totalShipments: results.processedShipments.length,
      processedShipments: 0,
      successfulShipments: 0,
      failedShipments: 0,
      currentStep: 'Starting label generation...',
      estimatedTimeRemaining: 0
    });
    
    try {
      console.log('Creating labels for shipments:', results.processedShipments);
      
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: results.processedShipments,
          pickupAddress,
          labelOptions: {
            format: 'PDF',
            size: '4x6',
            generateBatch: true
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Label creation response:', data);

      if (data.processedLabels && data.processedLabels.length > 0) {
        setResults({
          ...results,
          processedShipments: data.processedLabels,
          batchResult: data.batchResult,
          bulk_label_pdf_url: data.batchResult?.consolidatedLabelUrls?.pdf,
          bulk_label_png_url: data.batchResult?.consolidatedLabelUrls?.png,
        });

        setUploadStatus('success');
        toast.success(`Successfully created ${data.successful} shipping labels`);

        if (data.failedLabels && data.failedLabels.length > 0) {
          console.error('Failed labels:', data.failedLabels);
          toast.error(`${data.failedLabels.length} labels failed to create. Check console for details.`);
        }
      } else {
        throw new Error(data.message || 'No labels were created');
      }

    } catch (error) {
      console.error('Error creating labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create labels');
    } finally {
      setIsCreatingLabels(false);
      setLabelGenerationProgress({
        isGenerating: false,
        totalShipments: 0,
        processedShipments: 0,
        successfulShipments: 0,
        failedShipments: 0,
        currentStep: '',
        estimatedTimeRemaining: 0
      });
    }
  };

  const handleDownloadAllLabels = () => {
    if (!results) return;
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    // Download each label individually with staggered timing
    labelsWithUrls.forEach((shipment, index) => {
      setTimeout(() => {
        handleDownloadSingleLabel(shipment.label_url!, 'png');
      }, index * 300);
    });
    
    toast.success(`Started download of ${labelsWithUrls.length} labels`);
  };

  const handleDownloadLabelsWithFormat = async (format: 'pdf' | 'png' | 'zpl' | 'zip') => {
    if (!results) return;
    
    if (format === 'pdf' && results.bulk_label_pdf_url) {
      // Download bulk PDF
      handleDownloadSingleLabel(results.bulk_label_pdf_url, 'pdf');
      toast.success('Downloaded bulk PDF label');
      return;
    }
    
    const labelsWithUrls = results.processedShipments.filter(s => s.label_url);
    
    if (labelsWithUrls.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    if (format === 'zip') {
      toast.loading('Preparing ZIP download...');
      
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, 'png');
        }, index * 300);
      });
      
      toast.dismiss();
      toast.success(`Started download of ${labelsWithUrls.length} labels`);
    } else {
      labelsWithUrls.forEach((shipment, index) => {
        setTimeout(() => {
          handleDownloadSingleLabel(shipment.label_url!, format);
        }, index * 300);
      });
      
      toast.success(`Started download of ${labelsWithUrls.length} ${format.toUpperCase()} labels`);
    }
  };

  const handleDownloadSingleLabel = (labelUrl: string, format: string = 'png') => {
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
  };

  const handleEmailLabels = (email: string) => {
    toast.success('Email functionality will be implemented soon');
  };

  return {
    // Upload state
    file,
    isUploading,
    isPaying,
    isCreatingLabels,
    isFetchingRates,
    uploadStatus,
    results,
    progress,
    
    // Filters and sorting
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    
    // Address
    pickupAddress,
    
    // Error handling
    batchError,
    labelGenerationProgress,
    
    // Modal states
    batchPrintPreviewModalOpen,
    setBatchPrintPreviewModalOpen,
    showAddPaymentModal,
    setShowAddPaymentModal,
    
    // Setters
    setPickupAddress,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter,
    
    // Handlers
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

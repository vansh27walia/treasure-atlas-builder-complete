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
    console.log('🔄 useBulkUpload: handleEditShipment called with:', { shipmentId, updates });
    
    if (!results) {
      console.error('❌ No results available for editing');
      toast.error('No shipments available to edit');
      return;
    }
    
    console.log('📦 Current shipments before edit:', results.processedShipments.length);
    
    // STEP 1: SAVE CHANGES LOCALLY FIRST (as user requested)
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        console.log('🎯 Found shipment to update:', shipmentId);
        console.log('📋 Original shipment details:', shipment.details);
        console.log('🔧 Applying updates:', updates);
        
        const updatedShipment = { ...shipment, ...updates };
        
        // Validate FedEx phone number requirement
        if (updatedShipment.carrier?.toLowerCase().includes('fedex') && 
            !updatedShipment.details?.phone_number?.trim()) {
          console.error('❌ FedEx validation failed - missing phone number');
          toast.error('FedEx shipments require a phone number');
          return shipment; // Return unchanged if validation fails
        }
        
        // Check for international customs requirements
        const isInternational = updatedShipment.details?.to_country !== 'US' && 
                              updatedShipment.details?.to_country !== 'USA';
        if (isInternational) {
          console.log('🌍 International shipment detected:', updatedShipment.details?.to_country);
          toast.warning('International shipment - ensure customs documents are complete');
        }
        
        // Ensure insurance cost is properly calculated
        const insuranceEnabled = updatedShipment.details?.insurance_enabled !== false;
        const declaredValue = updatedShipment.details?.declared_value || 0;
        
        // Always recalculate insurance cost based on current settings
        updatedShipment.insurance_cost = insuranceEnabled && declaredValue > 0 
          ? Math.max(declaredValue * 0.02, 1) 
          : 0;
        
        console.log('✅ Shipment successfully updated LOCALLY (WEIGHT IN POUNDS):', {
          id: shipmentId,
          weightInPounds: updatedShipment.details?.weight,
          dimensions: {
            length: updatedShipment.details?.length,
            width: updatedShipment.details?.width,
            height: updatedShipment.details?.height
          },
          insuranceCost: updatedShipment.insurance_cost,
          phoneNumber: updatedShipment.details?.phone_number
        });
        
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
    
    console.log('💰 Totals recalculated after LOCAL edit:', {
      totalShippingCost,
      totalInsuranceCost,
      grandTotal,
      verification: `${totalShippingCost} + ${totalInsuranceCost} = ${grandTotal}`,
      updatedShipment: updatedShipments.find(s => s.id === shipmentId)
    });
    
    // Update the results state LOCALLY FIRST
    console.log('💾 Updating results state LOCALLY...');
    setResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: totalShippingCost,
      totalInsurance: totalInsuranceCost
    });
    
    console.log('✅ Results state updated LOCALLY successfully');
    toast.success('✅ Changes saved locally! Fetching new rates using NORMAL SHIPPING format...');
    
    // STEP 2: Auto-refresh rates using NORMAL SHIPPING format (get-shipping-rates)
    console.log('🔄 Scheduling NORMAL SHIPPING rate refresh for shipment:', shipmentId);
    setTimeout(() => {
      console.log('⏰ Rate refresh timer triggered, calling handleRefreshRates with NORMAL SHIPPING...');
      handleRefreshRates(shipmentId);
    }, 1500); // Increased delay to ensure state updates are complete
  };

  const handleRefreshRates = async (shipmentId: string) => {
    console.log('🔄 NORMAL SHIPPING handleRefreshRates called for shipment:', shipmentId);
    
    if (!results || !pickupAddress) {
      console.error('❌ Missing requirements for NORMAL SHIPPING rate refresh:', { 
        hasResults: !!results, 
        hasPickupAddress: !!pickupAddress 
      });
      toast.error('❌ Missing pickup address! Please set a pickup address in settings first.');
      return;
    }
    
    console.log('📍 CONFIRMED FROM ADDRESS (Pickup Address) for NORMAL SHIPPING:', {
      id: pickupAddress.id,
      name: pickupAddress.name,
      street1: pickupAddress.street1,
      street2: pickupAddress.street2,
      city: pickupAddress.city,
      state: pickupAddress.state,
      zip: pickupAddress.zip,
      country: pickupAddress.country
    });
    
    setIsFetchingRates(true);
    const shipment = results.processedShipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
      console.error('❌ Shipment not found:', shipmentId);
      toast.error('❌ Shipment not found for rate refresh');
      setIsFetchingRates(false);
      return;
    }

    try {
      console.log('🚚 NORMAL SHIPPING RATE REFRESH - Processing shipment with SAVED CHANGES:', { 
        shipmentId, 
        originalWeight: shipment.details?.weight,
        originalDimensions: {
          length: shipment.details?.length,
          width: shipment.details?.width,
          height: shipment.details?.height
        },
        recipient: shipment.recipient,
        phoneNumber: shipment.details?.phone_number,
        country: shipment.details?.to_country
      });
      
      // Extract address info from shipment details (should have updated values from edit)
      const to_name = shipment.details?.to_name || shipment.recipient || shipment.customer_name || 'Unknown';
      const to_street1 = shipment.details?.to_street1 || shipment.customer_address?.split(', ')[0] || 'Unknown Street';
      const to_city = shipment.details?.to_city || shipment.customer_address?.split(', ')[1] || 'Unknown City';
      const addressParts = shipment.customer_address?.split(', ') || [];
      const to_state = shipment.details?.to_state || (addressParts[2]?.split(' ')[0] || 'CA');
      const to_zip = shipment.details?.to_zip || (addressParts[2]?.split(' ')[1] || '90210');
      const to_country = shipment.details?.to_country || 'US';
      
      // CRITICAL: Use the UPDATED weight and dimensions from the edit (POUNDS ONLY)
      const weight = Number(shipment.details?.weight || 1); // POUNDS - no conversion
      const length = Number(shipment.details?.length || 1);
      const width = Number(shipment.details?.width || 1);
      const height = Number(shipment.details?.height || 1);
      const phone = shipment.details?.phone_number || shipment.customer_phone || '';
      
      console.log('📦 NORMAL SHIPPING FINAL PACKAGE DETAILS for API call (WEIGHT IN POUNDS):', {
        weightInPounds: weight,
        dimensions: { length, width, height },
        phone: phone,
        country: to_country,
        isFedEx: shipment.carrier?.toLowerCase().includes('fedex'),
        hasRequiredPhone: !!phone
      });
      
      // CRITICAL: Use EXACTLY the same format as NORMAL SHIPPING (EnhancedShippingForm)
      const payload = {
        fromAddress: {
          name: pickupAddress.name || '',
          company: pickupAddress.company || '',
          street1: pickupAddress.street1 || '',
          street2: pickupAddress.street2 || '',
          city: pickupAddress.city || '',
          state: pickupAddress.state || '',
          zip: pickupAddress.zip || '',
          country: pickupAddress.country || 'US',
          phone: pickupAddress.phone || ''
        },
        toAddress: {
          name: to_name,
          company: shipment.details?.to_company || '',
          street1: to_street1,
          street2: shipment.details?.to_street2 || '',
          city: to_city,
          state: to_state,
          zip: to_zip,
          country: to_country,
          phone: phone
        },
        parcel: {
          // CRITICAL: Weight in POUNDS ONLY (as user specified - NO OUNCES!)
          weight: weight,
          weight_unit: 'lb', // Always pounds - NO ounces
          length: length,
          width: width,
          height: height,
          predefined_package: 'box'
        },
        options: {},
        carriers: ['usps', 'ups', 'fedex', 'dhl'], // Same as normal shipping
        customs_info: null // Can be enhanced for international later
      };
      
      console.log('📄 NORMAL SHIPPING payload (get-shipping-rates):', payload);

      // CRITICAL: Use get-shipping-rates (SAME as normal shipping) NOT process-bulk-upload
      console.log('🌐 Calling get-shipping-rates (NORMAL SHIPPING FORMAT) with COMPLETE DATA...');
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        console.error('❌ NORMAL SHIPPING Edge function error during rate refresh:', error);
        throw new Error(`NORMAL SHIPPING rate refresh failed: ${error.message || 'Unknown API error'}`);
      }

      if (data && data.rates && Array.isArray(data.rates) && data.rates.length > 0) {
        console.log('✅ SUCCESS! Received NEW rates using NORMAL SHIPPING FORMAT:', {
          ratesCount: data.rates.length,
          newWeightUsed: weight,
          fromAddressUsed: pickupAddress.name
        });
        console.log('📋 New NORMAL SHIPPING rates preview:', data.rates.slice(0, 3).map((r: any) => `${r.carrier} ${r.service}: $${r.rate}`));
        
        // Convert normal shipping rates to bulk shipment format
        const normalizedRates = data.rates.map((rate: any) => ({
          id: rate.id || `rate_${Date.now()}_${Math.random()}`,
          carrier: rate.carrier,
          service: rate.service,
          rate: rate.rate,
          delivery_days: rate.delivery_days || 0,
          delivery_date: rate.delivery_date || '',
          currency: rate.currency || 'USD'
        }));
        
        // Update ONLY the specific shipment with new rates from NORMAL SHIPPING (preserve all changes made)
        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s, // Keep all existing changes from edit
              availableRates: normalizedRates,
              // Reset rate selection so user can choose from new rates
              selectedRateId: undefined,
              carrier: '',
              service: '',
              rate: 0
            };
          }
          return s;
        });

        // ENHANCED: Recalculate totals properly (row-by-row sum)
        const totalShippingCost = updatedShipments.reduce((sum, shipment) => sum + (shipment.rate || 0), 0);
        const totalInsuranceCost = updatedShipments.reduce((sum, shipment) => sum + (shipment.insurance_cost || 0), 0);
        const grandTotal = updatedShipments.reduce((sum, shipment) => {
          const rowTotal = (shipment.rate || 0) + (shipment.insurance_cost || 0);
          return sum + rowTotal;
        }, 0);

        console.log('💰 TOTALS after NORMAL SHIPPING rate refresh:', {
          totalShippingCost,
          totalInsuranceCost, 
          grandTotal,
          verification: `${totalShippingCost} + ${totalInsuranceCost} = ${grandTotal}`
        });

        console.log('💾 Updating results with NORMAL SHIPPING REFRESHED rates and SAVED changes...');
        setResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: totalShippingCost,
          totalInsurance: totalInsuranceCost
        });

        toast.success(`✅ RATES REFRESHED using NORMAL SHIPPING! Found ${normalizedRates.length} new rates with your saved changes. Please select one.`);
        console.log('🎉 NORMAL SHIPPING rate refresh completed successfully with saved changes!');
      } else {
        console.error('❌ No rate data received from NORMAL SHIPPING API response:', data);
        throw new Error('No rates returned from NORMAL SHIPPING API after refresh');
      }

    } catch (error) {
      console.error('❌ CRITICAL ERROR during NORMAL SHIPPING rate refresh:', error);
      toast.error(`❌ Failed to refresh rates using NORMAL SHIPPING: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsFetchingRates(false);
      console.log('🔄 NORMAL SHIPPING rate refresh process completed (success or failure)');
    }
  };

  const handleBulkApplyCarrier = (carrier: string, service: string) => {
    if (!results) return;
    
    console.log(`🔧 Applying carrier ${carrier} with service ${service} to all shipments`);
    
    const updatedShipments = results.processedShipments.map(shipment => {
      // Match by both carrier AND service for more precise selection
      const carrierRate = shipment.availableRates?.find(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase() && 
        rate.service.toLowerCase().includes(service.toLowerCase())
      );
      
      if (carrierRate) {
        console.log(`✅ Applied ${carrier} ${service} to shipment ${shipment.id}`);
        return {
          ...shipment,
          selectedRateId: carrierRate.id,
          carrier: carrierRate.carrier,
          service: carrierRate.service,
          rate: parseFloat(carrierRate.rate)
        };
      }
      
      console.log(`⚠️ No matching rate found for ${carrier} ${service} on shipment ${shipment.id}`);
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
    
    toast.success(`Applied ${carrier} ${service} to all shipments`);
  };
    
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

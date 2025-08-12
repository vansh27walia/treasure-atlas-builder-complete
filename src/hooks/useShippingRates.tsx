import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { standardizeCarrierName, standardizeServiceName } from '@/utils/carrierUtils';

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string; 
  original_rate?: string;
  isPremium?: boolean;
  insurance_cost?: number;
  total_cost?: number;
  discount_percentage?: number;
  isAIRecommended?: boolean;
  _insuranceSettings?: any;
  _hazmatSettings?: any;
}

interface LabelOptions {
  label_format?: string;
  label_size?: string;
  insurance?: {
    enabled: boolean;
    amount: number;
  };
  hazmat?: {
    enabled: boolean;
  };
  [key: string]: any;
}

interface EasyPostRatesEvent {
  detail: {
    rates: ShippingRate[];
    shipmentId: string;
  }
}

export const useShippingRates = () => {
  const navigate = useNavigate();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [filteredRates, setFilteredRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    carriers: [] as string[],
    maxPrice: undefined as number | undefined,
    maxDays: undefined as number | undefined,
    features: [] as string[],
    sortBy: 'price' as 'price' | 'speed' | 'carrier' | 'reliability',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  
  // Carrier filters
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);

  // Process and enhance rates with discount percentages and AI recommendations
  const processRates = (incomingRates: ShippingRate[]) => {
    const processedRates = incomingRates.map((rate, index) => {
      // Standardize carrier and service names
      const standardizedCarrier = standardizeCarrierName(rate.carrier);
      const standardizedService = standardizeServiceName(rate.service, standardizedCarrier);
      
      // The discount percentage should already come from the backend
      let discountPercentage = rate.discount_percentage || 0;
      
      if (!discountPercentage && rate.original_rate) {
        const originalRate = parseFloat(rate.original_rate);
        const currentRate = parseFloat(rate.rate);
        if (originalRate > currentRate) {
          discountPercentage = Math.round(((originalRate - currentRate) / originalRate) * 100);
        }
      }
      
      // Generate premium flag - typically express, overnight, or expensive services
      const isPremium = 
        standardizedService.toLowerCase().includes('express') || 
        standardizedService.toLowerCase().includes('priority') || 
        standardizedService.toLowerCase().includes('overnight') ||
        standardizedService.toLowerCase().includes('next day') ||
        standardizedService.toLowerCase().includes('same day') ||
        (rate.delivery_days === 1) ||
        parseFloat(rate.rate) > 20;
      
      // AI recommendation logic - recommend premium services or best value
      const isAIRecommended = isPremium || (
        rate.delivery_days <= 3 && 
        parseFloat(rate.rate) < 25 && 
        !standardizedService.toLowerCase().includes('ground')
      );
      
      // Mark UPS rates specially
      const isUPSRate = rate.source === 'ups' || standardizedCarrier === 'UPS';
      
      return {
        ...rate,
        carrier: standardizedCarrier,
        service: standardizedService,
        original_carrier: rate.carrier,
        original_service: rate.service,
        discount_percentage: discountPercentage,
        isPremium,
        isAIRecommended,
        isUPSRate // Add flag for UPS rates
      };
    });

    // Sort rates: UPS international rates first for international shipments, then Premium/Recommended, then by price
    return processedRates.sort((a, b) => {
      // First priority: UPS rates for international shipments
      if (a.isUPSRate && !b.isUPSRate) return -1;
      if (!a.isUPSRate && b.isUPSRate) return 1;
      
      // Second priority: Premium rates
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      
      // Third priority: AI Recommended rates
      if (a.isAIRecommended && !b.isAIRecommended) return -1;
      if (!a.isAIRecommended && b.isAIRecommended) return 1;
      
      // Finally: Sort by price (cheapest to most expensive)
      return parseFloat(a.rate) - parseFloat(b.rate);
    });
  };

  // Apply filters to rates
  const applyFilters = (ratesToFilter: ShippingRate[]) => {
    let filtered = [...ratesToFilter];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(rate => 
        rate.carrier.toLowerCase().includes(searchTerm) ||
        rate.service.toLowerCase().includes(searchTerm)
      );
    }

    // Carrier filter
    if (filters.carriers.length > 0) {
      filtered = filtered.filter(rate => 
        filters.carriers.some(carrier => 
          rate.carrier.toLowerCase().includes(carrier.toLowerCase())
        )
      );
    }

    // Price filter
    if (filters.maxPrice) {
      filtered = filtered.filter(rate => parseFloat(rate.rate) <= filters.maxPrice!);
    }

    // Days filter
    if (filters.maxDays) {
      filtered = filtered.filter(rate => rate.delivery_days <= filters.maxDays!);
    }

    // Features filter
    if (filters.features.length > 0) {
      filtered = filtered.filter(rate => {
        const hasExpress = filters.features.includes('express') && 
          (rate.isPremium || rate.delivery_days <= 2);
        const hasInsured = filters.features.includes('insured') && true; // All rates can be insured
        const hasTracking = filters.features.includes('tracking') && true; // All rates have tracking
        const hasPremium = filters.features.includes('premium') && rate.isPremium;
        
        return filters.features.every(feature => {
          switch (feature) {
            case 'express': return hasExpress;
            case 'insured': return hasInsured;
            case 'tracking': return hasTracking;
            case 'premium': return hasPremium;
            default: return true;
          }
        });
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'price':
          comparison = parseFloat(a.rate) - parseFloat(b.rate);
          break;
        case 'speed':
          comparison = a.delivery_days - b.delivery_days;
          break;
        case 'carrier':
          comparison = a.carrier.localeCompare(b.carrier);
          break;
        case 'reliability':
          // Sort by premium/recommended first, then by carrier reputation
          if (a.isAIRecommended && !b.isAIRecommended) comparison = -1;
          else if (!a.isAIRecommended && b.isAIRecommended) comparison = 1;
          else comparison = a.carrier.localeCompare(b.carrier);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  // Listen for rates from the shipping form component
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent<EasyPostRatesEvent['detail']>) => {
      if (event.detail && event.detail.rates) {
        console.log("Rates received:", event.detail.rates);
        console.log("Shipment ID received:", event.detail.shipmentId);
        
        // Add shipmentId to each rate object and process rates
        const processedRates = processRates(event.detail.rates).map(rate => ({
          ...rate,
          shipment_id: event.detail.shipmentId
        }));
        
        setRates(processedRates);
        setShipmentId(event.detail.shipmentId);
        setSelectedRateId(null);
        setLabelUrl(null);
        setTrackingCode(null);
        
        // Extract unique carriers for filtering
        const carriers = [...new Set(processedRates.map(rate => 
          rate.carrier.toUpperCase()
        ))];
        setUniqueCarriers(carriers);
        
        // Update workflow step
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'rates' }
        }));
        
        // Scroll to rates section with smooth behavior and delay
        setTimeout(() => {
          const ratesSection = document.getElementById('shipping-rates-section');
          if (ratesSection) {
            ratesSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start'
            });
          }
        }, 300);
        
        // Also dispatch a completed form event
        document.dispatchEvent(new Event('shipping-form-completed'));
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    
    // Listen for rate selection from other components
    const handleRateSelected = (event: CustomEvent<{rateId: string}>) => {
      if (event.detail && event.detail.rateId) {
        setSelectedRateId(event.detail.rateId);
        
        // Dispatch event for step change
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'rates' }
        }));
      }
    };
    
    document.addEventListener('select-shipping-rate', handleRateSelected as EventListener);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
      document.removeEventListener('select-shipping-rate', handleRateSelected as EventListener);
    };
  }, []);
  
  // Apply filters whenever rates or filters change
  useEffect(() => {
    const filtered = applyFilters(rates);
    setFilteredRates(filtered);
  }, [rates, filters]);

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    
    // Find the rate with this ID
    const selectedRate = rates.find(rate => rate.id === rateId);
    console.log("Selected rate:", selectedRate);
    
    // Scroll to the selected rate
    const selectedRateElement = document.querySelector(`[data-rate-id="${rateId}"]`);
    if (selectedRateElement) {
      setTimeout(() => {
        window.scrollTo({
          top: selectedRateElement.getBoundingClientRect().top + window.scrollY - 150,
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      carriers: [],
      maxPrice: undefined,
      maxDays: undefined,
      features: [],
      sortBy: 'price',
      sortOrder: 'asc'
    });
  };

  // Modified to include UPS shipment data storage for label creation
  const handleCreateLabel = async (
    rateIdParam?: string, 
    shipmentIdParam?: string, 
    labelOptions?: LabelOptions
  ): Promise<any> => {
    const effectiveRateId = rateIdParam || selectedRateId;
    const effectiveShipmentId = shipmentIdParam || shipmentId;
    
    if (!effectiveRateId || !effectiveShipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating label with shipmentId:", effectiveShipmentId, "and rateId:", effectiveRateId);
      
      // Get the selected rate to get insurance and hazmat settings
      const selectedRate = rates.find(rate => rate.id === effectiveRateId);
      const isInternational = selectedRate?.service?.toLowerCase().includes('international');
      const isUPSRate = effectiveRateId.startsWith('ups_');
      
      // Store shipment data for UPS if needed
      if (isUPSRate) {
        const shipmentData = this.getShipmentDataFromSession();
        sessionStorage.setItem(`shipment_${effectiveShipmentId}`, JSON.stringify(shipmentData));
      }
      
      // Choose the appropriate endpoint based on whether it's international or UPS
      let endpoint = 'create-label';
      if (isUPSRate) {
        endpoint = 'create-ups-label';
      } else if (isInternational) {
        endpoint = 'create-international-label';
      }
      
      // Merge label options with insurance and hazmat settings from the rate
      const options = {
        label_format: "PDF",
        label_size: "4x6",
        ...labelOptions,
        insurance: selectedRate?._insuranceSettings || { enabled: false, amount: 0 },
        hazmat: selectedRate?._hazmatSettings || { enabled: false }
      };
      
      console.log(`Using ${endpoint} endpoint for label creation with options:`, options);
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { 
          shipmentId: effectiveShipmentId, 
          rateId: effectiveRateId,
          options
        }
      });

      if (error) {
        console.error(`Error from ${endpoint} function:`, error);
        throw new Error(`Error creating label: ${error.message}`);
      }

      if (!data || !data.labelUrl) {
        console.error(`No data returned from ${endpoint} function`);
        throw new Error("No label data returned from server");
      }

      console.log("Label created successfully:", data);
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      
      // Force step update to label step
      document.dispatchEvent(new CustomEvent('shipping-step-change', { 
        detail: { step: 'label' }
      }));
      
      const carrierInfo = isUPSRate ? ' (UPS)' : '';
      toast.success(`Shipping label generated successfully${carrierInfo}`);
      
      return data;
      
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error("Failed to generate shipping label. Please try again.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper method to get shipment data from session for UPS
  const getShipmentDataFromSession = () => {
    const calculatorData = sessionStorage.getItem('calculatorData');
    if (calculatorData) {
      const data = JSON.parse(calculatorData);
      return {
        fromAddress: data.fromAddress,
        toAddress: data.toAddress,
        parcel: data.parcel
      };
    }
    return null;
  };

  // Function to handle payment process
  const handleProceedToPayment = () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Get the selected rate to determine the amount
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      
      if (!selectedRate) {
        throw new Error("Selected rate not found");
      }
      
      // Convert rate to cents for payment processing
      const amountInCents = Math.round(parseFloat(selectedRate.rate) * 100);
      
      // Navigate to payment page with necessary information
      navigate(`/payment?amount=${amountInCents}&shipmentId=${shipmentId}&rateId=${selectedRateId}`);
      
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      toast.error("Failed to process payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to determine the best value rate
  const getBestValueRate = () => {
    if (filteredRates.length === 0) return null;
    
    // Sort by price and delivery days to find the best value
    const sortedRates = [...filteredRates].sort((a, b) => {
      // First compare price
      const aPrice = parseFloat(a.rate);
      const bPrice = parseFloat(b.rate);
      if (aPrice !== bPrice) return aPrice - bPrice;
      
      // If price is the same, compare delivery days
      return (a.delivery_days || 999) - (b.delivery_days || 999);
    });
    
    return sortedRates[0]?.id;
  };

  // Function to determine the fastest rate
  const getFastestRate = () => {
    if (filteredRates.length === 0) return null;
    
    // Sort by delivery days to find the fastest
    const sortedRates = [...filteredRates].sort((a, b) => 
      (a.delivery_days || 999) - (b.delivery_days || 999)
    );
    
    return sortedRates[0]?.id;
  };

  const bestValueRateId = getBestValueRate();
  const fastestRateId = getFastestRate();

  return {
    rates: filteredRates,
    allRates: rates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    shipmentId,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    filters,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFiltersChange,
    handleClearFilters
  };
};

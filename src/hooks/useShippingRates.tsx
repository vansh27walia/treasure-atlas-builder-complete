
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';

interface ShippingRate {
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
  // Add the parcel property to fix the TypeScript error
  parcel?: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
}

interface LabelOptions {
  label_format?: string;
  label_size?: string;
  file_type?: string; // Added for PNG and PDF options
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
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string | 'all'>('all');
  const [labelError, setLabelError] = useState<string | null>(null);
  const [selectedLabelFormat, setSelectedLabelFormat] = useState<string>('4x6');
  const [selectedFileType, setSelectedFileType] = useState<'pdf' | 'png'>('pdf');
  
  // Carrier filters
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);

  // Process and enhance rates with original prices at 85-90% higher than actual rate
  const processRates = (incomingRates: ShippingRate[]) => {
    return incomingRates.map(rate => {
      // Generate a random discount percentage between 85% and 90%
      const discountPercentage = Math.random() * (90 - 85) + 85;
      
      // Calculate inflated original rate (actual rate + discount percentage)
      const actualRate = parseFloat(rate.rate);
      // Calculate what the "original" price would be before our massive discount
      const inflatedRate = (actualRate * (100 / (100 - discountPercentage))).toFixed(2);
      
      // Generate premium flag - typically express, overnight, or most expensive services
      const isPremium = 
        rate.service.toLowerCase().includes('express') || 
        rate.service.toLowerCase().includes('priority') || 
        rate.service.toLowerCase().includes('overnight') ||
        rate.service.toLowerCase().includes('next day') ||
        rate.service.toLowerCase().includes('same day') ||
        (rate.delivery_days === 1) ||
        actualRate > 20; // If rate is above $20, consider it a premium service
      
      return {
        ...rate,
        original_rate: inflatedRate,
        isPremium
      };
    });
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
        setFilteredRates(processedRates);
        setShipmentId(event.detail.shipmentId);
        setSelectedRateId(null);
        setLabelUrl(null);
        setTrackingCode(null);
        setLabelError(null);
        
        // Extract unique carriers for filtering
        const carriers = [...new Set(processedRates.map(rate => 
          rate.carrier.toUpperCase()
        ))];
        setUniqueCarriers(carriers);
        setActiveCarrierFilter('all');
        
        // Update workflow step
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'rates' }
        }));
        
        // Scroll to rates section with smooth behavior and delay
        setTimeout(() => {
          const ratesSection = document.getElementById('shipping-rates-section');
          if (ratesSection) {
            // Use scrollIntoView with behavior smooth
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
  
  // Filter rates when carrier filter changes
  useEffect(() => {
    if (activeCarrierFilter === 'all') {
      setFilteredRates(rates);
    } else {
      const filtered = rates.filter(rate => 
        rate.carrier.toUpperCase() === activeCarrierFilter.toUpperCase()
      );
      setFilteredRates(filtered);
    }
  }, [activeCarrierFilter, rates]);

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    
    // Clear any previous label error
    setLabelError(null);
    
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
  
  const handleFilterByCarrier = (carrier: string | 'all') => {
    setActiveCarrierFilter(carrier);
  };

  // Modified to accept rateId and shipmentId params for automatic calling
  // Added labelOptions parameter to support different label formats
  const handleCreateLabel = async (
    rateIdParam?: string, 
    shipmentIdParam?: string, 
    labelOptions?: LabelOptions
  ): Promise<any> => {
    const effectiveRateId = rateIdParam || selectedRateId;
    const effectiveShipmentId = shipmentIdParam || shipmentId;
    
    if (!effectiveRateId || !effectiveShipmentId) {
      const errorMessage = "Please select a shipping rate first";
      toast.error(errorMessage);
      setLabelError(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    setIsLoading(true);
    setLabelError(null);
    
    try {
      console.log("Creating label with shipmentId:", effectiveShipmentId, "and rateId:", effectiveRateId);
      console.log("Label options:", labelOptions);
      
      // Get the selected rate to determine if it's international
      const selectedRate = rates.find(rate => rate.id === effectiveRateId);
      const isInternational = selectedRate?.service?.toLowerCase().includes('international');
      
      // Choose the appropriate endpoint based on whether it's international
      const endpoint = isInternational ? 'create-international-label' : 'create-label';
      
      console.log(`Using ${endpoint} endpoint for label creation with options:`, labelOptions);
      
      // Add default label format and size if not provided
      const options = {
        label_format: "PDF",
        label_size: selectedLabelFormat || "4x6",
        file_type: selectedFileType || "pdf",
        ...labelOptions
      };
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { 
          shipmentId: effectiveShipmentId, 
          rateId: effectiveRateId,
          options
        }
      });

      if (error) {
        console.error(`Error from ${endpoint} function:`, error);
        const errorMsg = `Error creating label: ${error.message}`;
        setLabelError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!data || !data.labelUrl) {
        const errorMsg = "No label data returned from server";
        console.error(`No data returned from ${endpoint} function`);
        setLabelError(errorMsg);
        throw new Error(errorMsg);
      }

      console.log("Label created successfully:", data);
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      setLabelError(null);
      
      // Force step update to label step
      document.dispatchEvent(new CustomEvent('shipping-step-change', { 
        detail: { step: 'label' }
      }));
      
      toast.success("Shipping label generated successfully");
      
      return data;
      
    } catch (error) {
      console.error('Error creating label:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error creating shipping label';
      toast.error("Failed to generate shipping label. Please try again.");
      setLabelError(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
  
  // Function to update label format settings
  const setLabelFormat = (format: string) => {
    setSelectedLabelFormat(format);
  };
  
  // Function to update file type (pdf, png)
  const setFileType = (type: 'pdf' | 'png') => {
    setSelectedFileType(type);
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
    activeCarrierFilter,
    labelError,
    selectedLabelFormat,
    selectedFileType,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier,
    setLabelFormat,
    setFileType
  };
};

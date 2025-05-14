
import { useState, useEffect, useRef } from 'react';
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
  
  // Carrier filters
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);

  // Add a mounted ref to prevent state updates after unmounting
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      // Set to false when component unmounts
      isMountedRef.current = false;
    };
  }, []);

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
      if (!isMountedRef.current) return;
      
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
          if (!isMountedRef.current) return;
          
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
      if (!isMountedRef.current) return;
      
      if (event.detail && event.detail.rateId) {
        setSelectedRateId(event.detail.rateId);
        
        // Dispatch event for step change
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'label' }
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
    if (!isMountedRef.current) return;

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
    if (!isMountedRef.current) return;
    
    setSelectedRateId(rateId);
    
    // Dispatch rate-selected event
    document.dispatchEvent(new Event('rate-selected'));
    
    // Find the rate with this ID
    const selectedRate = rates.find(rate => rate.id === rateId);
    console.log("Selected rate:", selectedRate);
    
    // Update workflow step
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'label' }
    }));
    
    // Scroll to the selected rate without animation
    const selectedRateElement = document.querySelector(`[data-rate-id="${rateId}"]`);
    if (selectedRateElement) {
      setTimeout(() => {
        if (isMountedRef.current) {
          window.scrollTo({
            top: selectedRateElement.getBoundingClientRect().top + window.scrollY - 150,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };
  
  const handleFilterByCarrier = (carrier: string | 'all') => {
    if (!isMountedRef.current) return;
    setActiveCarrierFilter(carrier);
  };

  // Simplified create label function that follows the previous reliable pattern
  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    if (!isMountedRef.current) return;
    setIsLoading(true);
    
    try {
      console.log("Creating label with shipmentId:", shipmentId, "and rateId:", selectedRateId);
      
      // Direct approach without extra parameters to minimize complexity
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: shipmentId, 
          rateId: selectedRateId,
          options: {
            label_format: "PDF",
            label_size: "4x6"
          }
        }
      });

      if (error) {
        console.error(`Error from create-label function:`, error);
        throw new Error(`Error creating label: ${error.message}`);
      }

      if (!data || !data.labelUrl) {
        console.error(`No data returned from create-label function`);
        throw new Error("No label data returned from server");
      }

      console.log("Label created successfully:", data);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLabelUrl(data.labelUrl);
        setTrackingCode(data.trackingCode);
        toast.success("Shipping label generated successfully");
        
        // Update workflow step to complete
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'complete' }
        }));
        
        // Build the success URL with all needed parameters
        const labelSuccessUrl = `/label-success?labelUrl=${encodeURIComponent(data.labelUrl)}&trackingCode=${encodeURIComponent(data.trackingCode || '')}&shipmentId=${encodeURIComponent(data.shipmentId || shipmentId)}`;
        console.log("Navigating to:", labelSuccessUrl);
        
        // Use navigate with the correct URL
        navigate(labelSuccessUrl, { replace: true });
        
        // Scroll to top of page before navigating
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error creating label:', error);
      if (isMountedRef.current) {
        toast.error("Failed to generate shipping label. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Function to handle payment process
  const handleProceedToPayment = () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    if (!isMountedRef.current) return;
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
      if (isMountedRef.current) {
        toast.error("Failed to process payment. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsProcessingPayment(false);
      }
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
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier
  };
};

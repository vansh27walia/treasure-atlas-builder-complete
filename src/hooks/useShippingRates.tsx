
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

  // Process and enhance rates with original prices
  const processRates = (incomingRates: ShippingRate[]) => {
    return incomingRates.map(rate => {
      // If rate already has an original_rate, use it
      if (rate.original_rate) {
        return rate;
      }
      
      // If no original_rate but has list_rate or retail_rate, use the higher one as original
      if (rate.list_rate || rate.retail_rate) {
        const listRateValue = rate.list_rate ? parseFloat(rate.list_rate) : 0;
        const retailRateValue = rate.retail_rate ? parseFloat(rate.retail_rate) : 0;
        
        // Use the higher rate as original
        if (listRateValue > 0 || retailRateValue > 0) {
          const original = Math.max(listRateValue, retailRateValue).toString();
          return {
            ...rate,
            original_rate: original
          };
        }
      }
      
      // No changes needed
      return rate;
    });
  };

  // Listen for rates from the shipping form component
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent<EasyPostRatesEvent['detail']>) => {
      if (event.detail && event.detail.rates) {
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
        
        // Scroll to rates section
        setTimeout(() => {
          const ratesSection = document.getElementById('shipping-rates-section');
          if (ratesSection) {
            ratesSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    
    // Listen for rate selection from other components
    const handleRateSelected = (event: CustomEvent<{rateId: string}>) => {
      if (event.detail && event.detail.rateId) {
        setSelectedRateId(event.detail.rateId);
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
    
    // Scroll to the selected rate
    setTimeout(() => {
      const selectedRateElement = document.querySelector(`[data-rate-id="${rateId}"]`);
      if (selectedRateElement) {
        selectedRateElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  const handleFilterByCarrier = (carrier: string | 'all') => {
    setActiveCarrierFilter(carrier);
  };

  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating label with shipmentId:", shipmentId, "and rateId:", selectedRateId);
      
      // Get the selected rate to determine if it's international
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      const isInternational = selectedRate?.service?.toLowerCase().includes('international');
      
      // Choose the appropriate endpoint based on whether it's international
      const endpoint = isInternational ? 'create-international-label' : 'create-label';
      
      console.log(`Using ${endpoint} endpoint for label creation with options`);
      
      // Add label format and size to options
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { 
          shipmentId, 
          rateId: selectedRateId,
          options: {
            label_format: "PDF",
            label_size: "4x6"
          }
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
      toast.success("Shipping label generated successfully");
      
      // Navigate to the label success page with all parameters
      navigate(`/label-success?labelUrl=${encodeURIComponent(data.labelUrl)}&trackingCode=${encodeURIComponent(data.trackingCode || '')}&shipmentId=${encodeURIComponent(data.shipmentId || shipmentId)}`);
      
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error("Failed to generate shipping label. Please try again.");
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

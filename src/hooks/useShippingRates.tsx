
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
  shipment_id?: string; // Added the missing property
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
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // Listen for rates from the shipping form component
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent<EasyPostRatesEvent['detail']>) => {
      if (event.detail && event.detail.rates) {
        // Add shipmentId to each rate object
        const ratesWithShipmentId = event.detail.rates.map(rate => ({
          ...rate,
          shipment_id: event.detail.shipmentId
        }));
        
        setRates(ratesWithShipmentId);
        setShipmentId(event.detail.shipmentId);
        setSelectedRateId(null);
        setLabelUrl(null);
        setTrackingCode(null);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    };
  }, []);

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };

  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { shipmentId, rateId: selectedRateId }
      });

      if (error) {
        throw new Error(`Error creating label: ${error.message}`);
      }

      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      toast.success("Shipping label generated successfully");
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error("Failed to generate shipping label");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }

    const selectedRate = rates.find(rate => rate.id === selectedRateId);
    if (!selectedRate) {
      toast.error("Selected rate not found");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create a Stripe checkout session for the shipping label
      const amount = Math.round(parseFloat(selectedRate.rate) * 100); // Convert to cents
      const { data, error } = await supabase.functions.invoke('create-bulk-checkout', {
        body: {
          amount: amount,
          quantity: 1,
          description: `Shipping Label - ${selectedRate.carrier} ${selectedRate.service}`
        }
      });

      if (error) throw new Error(error.message);

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
      setIsProcessingPayment(false);
    }
  };

  // Function to determine the best value rate
  const getBestValueRate = () => {
    if (rates.length === 0) return null;
    
    // Sort by price and delivery days to find the best value
    const sortedRates = [...rates].sort((a, b) => {
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
    if (rates.length === 0) return null;
    
    // Sort by delivery days to find the fastest
    const sortedRates = [...rates].sort((a, b) => 
      (a.delivery_days || 999) - (b.delivery_days || 999)
    );
    
    return sortedRates[0]?.id;
  };

  const bestValueRateId = getBestValueRate();
  const fastestRateId = getFastestRate();

  return {
    rates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    bestValueRateId,
    fastestRateId,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment
  };
};

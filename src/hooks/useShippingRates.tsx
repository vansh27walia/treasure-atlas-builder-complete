
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShippingRate } from '@/types/shipping';
import { toast } from '@/hooks/use-toast';

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [bestValueRateId, setBestValueRateId] = useState<string | null>(null);
  const [fastestRateId, setFastestRateId] = useState<string | null>(null);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');

  // Get unique carriers from rates
  const uniqueCarriers = [...new Set(allRates.map(rate => rate.carrier))];

  useEffect(() => {
    // Listen for rates from custom events
    const handleRatesReceived = (event: any) => {
      if (event.detail && Array.isArray(event.detail.rates)) {
        const receivedRates = event.detail.rates.map((rate: any) => ({
          ...rate,
          rate: String(rate.rate), // Ensure rate is a string
          original_rate: rate.original_rate ? String(rate.original_rate) : undefined, // Ensure original_rate is a string
        }));
        
        // Set rates in state
        setAllRates(receivedRates);
        setRates(receivedRates);
        
        // Find best value and fastest rates
        if (receivedRates.length > 0) {
          const sortedByPrice = [...receivedRates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
          const sortedBySpeed = [...receivedRates].sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
          
          setBestValueRateId(sortedByPrice[0]?.id || null);
          setFastestRateId(sortedBySpeed[0]?.id || null);
        }
        
        // Set shipment ID if available
        if (event.detail.shipmentId) {
          setShipmentId(event.detail.shipmentId);
        }
      }
    };
    
    document.addEventListener('easypost-rates-received', handleRatesReceived);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived);
    };
  }, []);

  // Handle filtering by carrier
  const handleFilterByCarrier = (carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      setRates(allRates.filter(rate => rate.carrier === carrier));
    }
  };

  // Handle rate selection
  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };

  // Handle label creation
  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error('Please select a shipping rate first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { shipmentId, rateId: selectedRateId }
      });
      
      if (error) throw error;
      
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      toast.success('Label created successfully');
    } catch (error: any) {
      console.error('Error creating label:', error);
      toast.error(`Failed to create label: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment flow
  const handleProceedToPayment = () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }
    
    setIsProcessingPayment(true);
    
    // Simulated payment process
    setTimeout(() => {
      setIsProcessingPayment(false);
      handleCreateLabel();
    }, 1000);
  };
  
  // Reset the shipping state
  const resetShippingState = () => {
    setRates([]);
    setAllRates([]);
    setSelectedRateId(null);
    setLabelUrl(null);
    setTrackingCode(null);
    setShipmentId(null);
    setBestValueRateId(null);
    setFastestRateId(null);
    setActiveCarrierFilter('all');
  };

  return {
    rates,
    allRates,
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
    handleFilterByCarrier,
    resetShippingState
  };
};

export default useShippingRates;

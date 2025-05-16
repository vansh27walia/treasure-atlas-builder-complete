
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ShippingOption } from '@/types/shipping';

export const useShippingRates = () => {
  const [fromAddress, setFromAddress] = useState<any>(null);
  const [toAddress, setToAddress] = useState<any>(null);
  const [parcel, setParcel] = useState<any>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [allRates, setAllRates] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [bestValueRateId, setBestValueRateId] = useState<string | null>(null);
  const [fastestRateId, setFastestRateId] = useState<string | null>(null);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState('all');
  
  // Get unique carriers from rates
  const uniqueCarriers = [...new Set(allRates.map(rate => rate.carrier.toLowerCase()))];
  
  // Filter rates by carrier
  useEffect(() => {
    if (activeCarrierFilter === 'all') {
      setRates(allRates);
    } else {
      setRates(allRates.filter(rate => 
        rate.carrier.toLowerCase() === activeCarrierFilter.toLowerCase()
      ));
    }
  }, [activeCarrierFilter, allRates]);
  
  // Identify best value and fastest rates
  useEffect(() => {
    if (allRates.length > 0) {
      // Find cheapest rate
      const cheapestRate = [...allRates].sort((a, b) => 
        a.rate - b.rate
      )[0];
      
      // Find fastest rate
      const fastestRate = [...allRates].sort((a, b) => {
        const aDays = a.delivery_days || 999;
        const bDays = b.delivery_days || 999;
        return aDays - bDays;
      })[0];
      
      setBestValueRateId(cheapestRate.id);
      setFastestRateId(fastestRate.id);
      
      // Auto-select best value if no rate is selected
      if (!selectedRateId) {
        setSelectedRateId(cheapestRate.id);
      }
    }
  }, [allRates, selectedRateId]);
  
  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    
    // Dispatch custom event for rate selection
    const event = new CustomEvent('rate-selected', { 
      detail: { rateId } 
    });
    document.dispatchEvent(event);
  };
  
  const handleCreateLabel = async () => {
    if (!selectedRateId) {
      toast.error("Please select a shipping rate first");
      return;
    }

    setIsLoading(true);
    toast.loading("Creating shipping label...");

    try {
      const isInternational = fromAddress?.country !== toAddress?.country;
      const endpointName = isInternational ? 'create-international-label' : 'create-label';
      
      const { data, error } = await supabase.functions.invoke(endpointName, {
        body: { 
          shipmentId: shipmentId || '',
          rateId: selectedRateId,
          options: {
            label_format: "PDF",
            label_size: "4x6"
          }
        }
      });

      if (error) throw new Error(error.message);
      
      toast.dismiss();
      toast.success("Label created successfully!");
      
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);

      // Raise an event to update workflow
      const event = new CustomEvent('shipping-step-change', {
        detail: {
          step: 'complete' as const
        }
      });
      document.dispatchEvent(event);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to create label");
      console.error("Label creation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProceedToPayment = async () => {
    if (!selectedRateId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Get the selected rate
      const selectedRate = allRates.find(rate => rate.id === selectedRateId);
      if (!selectedRate) throw new Error("Selected rate not found");
      
      // Calculate amount in cents for Stripe
      const amountInCents = Math.round(selectedRate.rate * 100);
      
      // Create checkout session with Stripe
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          amount: amountInCents,
          description: `Shipping Label - ${selectedRate.carrier} ${selectedRate.service}`,
          metadata: {
            shipment_id: shipmentId || '',
            rate_id: selectedRateId,
            carrier: selectedRate.carrier,
            service: selectedRate.service
          }
        }
      });

      if (error) throw new Error(error.message);
      
      // Create label before redirecting to payment
      await handleCreateLabel();
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  const handleFilterByCarrier = (carrier: string) => {
    setActiveCarrierFilter(carrier);
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
    setRates: setAllRates,
    setSelectedRateId,
    setFromAddress,
    setToAddress,
    setParcel,
    setShipmentId,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier
  };
};

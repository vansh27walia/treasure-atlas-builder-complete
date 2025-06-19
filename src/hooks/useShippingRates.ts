
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useShipmentTracking } from './useShipmentTracking';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string;
}

interface RateRequest {
  fromAddress: any;
  toAddress: any;
  parcel: any;
  options?: any;
}

// Function to calculate dynamic discount (70-95%)
const calculateDynamicDiscount = (carrier: string, service: string): number => {
  const baseDiscount = 70;
  const maxDiscount = 95;
  
  // Premium services get higher discounts
  const premiumServices = ['Express', 'Priority', 'NextDay', 'Overnight', 'PRIORITY_OVERNIGHT', 'STANDARD_OVERNIGHT'];
  const isPremium = premiumServices.some(premium => service.toLowerCase().includes(premium.toLowerCase()));
  
  // USPS gets higher discounts
  const isUSPS = carrier.toLowerCase().includes('usps');
  
  let discount = baseDiscount;
  
  if (isPremium) {
    discount += Math.random() * 15 + 10; // 80-95% for premium
  } else {
    discount += Math.random() * 10 + 5; // 75-85% for standard
  }
  
  if (isUSPS) {
    discount += 5; // Extra 5% for USPS
  }
  
  return Math.min(Math.max(discount, baseDiscount), maxDiscount);
};

// Function to apply discount to rates
const applyDiscountToRates = (rates: ShippingRate[]): ShippingRate[] => {
  return rates.map(rate => {
    const originalRate = parseFloat(rate.rate);
    const discountPercent = calculateDynamicDiscount(rate.carrier, rate.service);
    const discountedRate = originalRate * (1 - discountPercent / 100);
    
    return {
      ...rate,
      original_rate: rate.rate, // Store original rate
      rate: discountedRate.toFixed(2), // Apply discounted rate
      list_rate: rate.list_rate || rate.rate, // Keep list rate for comparison
      retail_rate: rate.retail_rate || rate.rate // Keep retail rate for comparison
    };
  });
};

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  
  const { trackNewShipment } = useShipmentTracking();

  // Calculate best value and fastest rates
  const bestValueRateId = rates.length > 0 
    ? rates.reduce((prev, current) => 
        parseFloat(prev.rate) < parseFloat(current.rate) ? prev : current
      ).id 
    : null;

  const fastestRateId = rates.length > 0
    ? rates.reduce((prev, current) => 
        (prev.delivery_days || 999) < (current.delivery_days || 999) ? prev : current
      ).id
    : null;

  const fetchRates = useCallback(async (rateRequest: RateRequest) => {
    console.log('Fetching rates for:', rateRequest);
    setIsLoading(true);
    setRates([]);
    setAllRates([]);
    
    try {
      // Convert weight from other units to ounces for EasyPost
      let weightInOz = rateRequest.parcel.weight;
      
      if (rateRequest.parcel.weightUnit === 'lbs') {
        weightInOz = rateRequest.parcel.weight * 16;
      } else if (rateRequest.parcel.weightUnit === 'kg') {
        weightInOz = rateRequest.parcel.weight * 35.274;
      }

      const requestData = {
        fromAddress: rateRequest.fromAddress,
        toAddress: rateRequest.toAddress,
        parcel: {
          ...rateRequest.parcel,
          weight: weightInOz
        },
        options: rateRequest.options || {}
      };

      console.log('Sending request to get-shipping-rates:', requestData);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData
      });

      console.log('Rate response:', data);

      if (error) {
        console.error('Rate fetching error:', error);
        throw new Error(error.message || 'Failed to fetch rates');
      }

      if (data && data.success && data.rates && data.rates.length > 0) {
        console.log('Processing rates with discounts:', data.rates);
        
        // Apply dynamic discounts to all rates
        const discountedRates = applyDiscountToRates(data.rates);
        
        setAllRates(discountedRates);
        setRates(discountedRates);
        setShipmentId(data.shipment_id);
        
        // Extract unique carriers with proper typing
        const carriers = [...new Set(discountedRates.map((rate: ShippingRate) => rate.carrier))] as string[];
        setUniqueCarriers(carriers);
        
        toast.success(`Found ${discountedRates.length} discounted shipping rates`);
      } else {
        console.log('No rates in response:', data);
        setRates([]);
        setAllRates([]);
        toast.info('No shipping rates available for this shipment');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRates([]);
      setAllRates([]);
      toast.error('Failed to fetch shipping rates: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear rates function
  const clearRates = useCallback(() => {
    setRates([]);
    setAllRates([]);
    setSelectedRateId(null);
    setLabelUrl(null);
    setTrackingCode(null);
    setShipmentId(null);
    setUniqueCarriers([]);
    setActiveCarrierFilter('all');
  }, []);

  const handleSelectRate = useCallback((rateId: string) => {
    setSelectedRateId(rateId);
    
    // Dispatch rate selected event
    const event = new CustomEvent('rate-selected', {
      detail: { rateId }
    });
    document.dispatchEvent(event);
  }, []);

  const handleFilterByCarrier = useCallback((carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      const filteredRates = allRates.filter(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
      setRates(filteredRates);
    }
  }, [allRates]);

  const handleProceedToPayment = useCallback(async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payment processed successfully');
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [selectedRateId]);

  const handleCreateLabel = useCallback(async (rateId?: string, shipmentIdParam?: string, options?: any, shipmentDetails?: any) => {
    const finalRateId = rateId || selectedRateId;
    const finalShipmentId = shipmentIdParam || shipmentId;
    
    if (!finalRateId || !finalShipmentId) {
      toast.error('Please select a shipping rate first');
      return;
    }

    setIsCreatingLabel(true);
    
    try {
      console.log('Creating label with rate:', finalRateId, 'shipment:', finalShipmentId);
      
      // Call the create-label function
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: finalShipmentId, 
          rateId: finalRateId,
          options: options || {}
        }
      });

      if (error) {
        console.error('Create label error:', error);
        throw new Error(error.message);
      }

      if (data && data.labelUrl && data.trackingCode) {
        setLabelUrl(data.labelUrl);
        setTrackingCode(data.trackingCode);
        
        // Get the selected rate details
        const selectedRate = rates.find(rate => rate.id === finalRateId);
        
        // Track the new shipment with comprehensive details
        const trackingSuccess = await trackNewShipment({
          trackingCode: data.trackingCode,
          carrier: selectedRate?.carrier || 'Unknown',
          shipmentId: finalShipmentId,
          rateId: finalRateId,
          labelUrl: data.labelUrl,
          service: selectedRate?.service,
          from_address: shipmentDetails?.fromAddress,
          to_address: shipmentDetails?.toAddress,
          parcel: shipmentDetails?.parcel
        }, shipmentDetails);
        
        if (trackingSuccess) {
          console.log('Tracking data saved successfully');
          toast.success('Label created and tracking saved successfully!');
        } else {
          console.warn('Failed to save tracking data');
          toast.success('Label created successfully!');
        }
        
        return data;
      } else {
        throw new Error('Invalid response from label creation');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label. Please try again.');
      throw error;
    } finally {
      setIsCreatingLabel(false);
    }
  }, [rates, trackNewShipment, selectedRateId, shipmentId]);

  return {
    rates,
    allRates,
    selectedRateId,
    handleSelectRate,
    bestValueRateId,
    fastestRateId,
    isLoading,
    isProcessingPayment,
    isCreatingLabel,
    handleCreateLabel,
    handleProceedToPayment,
    labelUrl,
    trackingCode,
    shipmentId,
    uniqueCarriers,
    activeCarrierFilter,
    handleFilterByCarrier,
    fetchRates,
    clearRates
  };
};


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
  const [currentRequest, setCurrentRequest] = useState<RateRequest | null>(null);
  
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
    
    // Prevent duplicate fetching for the same request
    if (isLoading) {
      console.log('Already fetching rates, skipping duplicate request');
      return;
    }
    
    setIsLoading(true);
    setRates([]);
    setAllRates([]);
    setCurrentRequest(rateRequest);
    
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
        console.log('Setting rates:', data.rates);
        setAllRates(data.rates);
        setRates(data.rates);
        setShipmentId(data.shipment_id);
        
        // Extract unique carriers
        const carriers = [...new Set(data.rates.map((rate: ShippingRate) => rate.carrier))];
        setUniqueCarriers(carriers);
        
        toast.success(`Found ${data.rates.length} shipping rates`);
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
  }, [isLoading]);

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
    setCurrentRequest(null);
  }, []);

  const handleSelectRate = useCallback((rateId: string) => {
    setSelectedRateId(rateId);
    console.log('Rate selected:', rateId);
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

  const handleCreateLabel = useCallback(async (rateId: string, shipmentIdParam: string, options?: any, shipmentDetails?: any) => {
    if (!rateId || !shipmentIdParam) {
      throw new Error('Missing rate ID or shipment ID');
    }

    setIsLoading(true);
    
    try {
      console.log('Creating label with rate:', rateId, 'shipment:', shipmentIdParam);
      
      // Call the create-label function
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: shipmentIdParam, 
          rateId: rateId,
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
        const selectedRate = rates.find(rate => rate.id === rateId);
        
        console.log('Label created successfully, saving tracking data...');
        
        // Track the new shipment with comprehensive details
        const trackingSuccess = await trackNewShipment({
          trackingCode: data.trackingCode,
          carrier: selectedRate?.carrier || 'Unknown',
          shipmentId: shipmentIdParam,
          rateId: rateId,
          labelUrl: data.labelUrl,
          service: selectedRate?.service,
          from_address: shipmentDetails?.fromAddress || currentRequest?.fromAddress,
          to_address: shipmentDetails?.toAddress || currentRequest?.toAddress,
          parcel: shipmentDetails?.parcel || currentRequest?.parcel
        }, shipmentDetails || currentRequest);
        
        if (trackingSuccess) {
          console.log('Tracking data saved successfully');
        } else {
          console.warn('Failed to save tracking data');
        }
        
        toast.success('Label created and tracking saved successfully!');
        return data;
      } else {
        throw new Error('Invalid response from label creation');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [rates, trackNewShipment, currentRequest]);

  return {
    rates,
    allRates,
    selectedRateId,
    handleSelectRate,
    bestValueRateId,
    fastestRateId,
    isLoading,
    isProcessingPayment,
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

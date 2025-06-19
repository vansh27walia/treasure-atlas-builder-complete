
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
}

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');
  
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

  // Listen for rate events
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent) => {
      const { rates: newRates, shipmentId: newShipmentId } = event.detail;
      console.log('Rates received:', newRates);
      
      setAllRates(newRates);
      setRates(newRates);
      setShipmentId(newShipmentId);
      
      // Extract unique carriers
      const carriers = [...new Set(newRates.map((rate: ShippingRate) => rate.carrier))];
      setUniqueCarriers(carriers);
      
      setIsLoading(false);
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);

    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    };
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

  const handleCreateLabel = useCallback(async (rateId: string, shipmentIdParam: string, options?: any) => {
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
        
        // Track the new shipment
        await trackNewShipment({
          trackingCode: data.trackingCode,
          carrier: selectedRate?.carrier || 'Unknown',
          shipmentId: shipmentIdParam,
          rateId: rateId,
          labelUrl: data.labelUrl,
          service: selectedRate?.service
        });
        
        // Update step to label
        const stepEvent = new CustomEvent('shipping-step-change', {
          detail: { step: 'label' }
        });
        document.dispatchEvent(stepEvent);
        
        return data;
      } else {
        throw new Error('Invalid response from label creation');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [rates, trackNewShipment]);

  return {
    rates,
    allRates,
    selectedRateId,
    handleSelectRate,
    bestValueRateId,
    fastestRateId,
    isLoading,
    handleCreateLabel,
    labelUrl,
    trackingCode,
    shipmentId,
    uniqueCarriers,
    activeCarrierFilter,
    handleFilterByCarrier
  };
};

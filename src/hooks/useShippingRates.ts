
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Address {
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  company?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  delivery_date_guaranteed: boolean;
  est_delivery_days: number;
  shipment_id: string;
  carrier_account_id: string;
}

interface RateRequest {
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
  options?: Record<string, any>;
}

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  const fetchRates = useCallback(async (rateRequest: RateRequest) => {
    setIsLoading(true);
    setError(null);
    setRates([]);

    try {
      console.log('Fetching rates with request:', rateRequest);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: rateRequest
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch shipping rates');
      }

      console.log('Rates fetched successfully:', data.rates);
      setRates(data.rates || []);
      setShipmentId(data.shipment_id);
      
      if (data.rates && data.rates.length > 0) {
        toast.success(`Found ${data.rates.length} shipping rates`);
      } else {
        toast.warning('No shipping rates available for this shipment');
      }

    } catch (error) {
      console.error('Error fetching rates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shipping rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRates = useCallback(() => {
    setRates([]);
    setError(null);
    setShipmentId(null);
  }, []);

  return {
    rates,
    isLoading,
    error,
    shipmentId,
    fetchRates,
    clearRates
  };
};

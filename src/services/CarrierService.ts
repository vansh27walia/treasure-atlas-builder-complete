
import { supabase } from "@/integrations/supabase/client";

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string | null;
  delivery_date_guaranteed?: string | null;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  source?: string;
  isUPSRate?: boolean;
}

export interface ShippingRequest {
  fromAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  toAddress: {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
  parcel: {
    length?: number;
    width?: number;
    height?: number;
    weight: number;
    predefined_package?: string;
  };
  options?: any;
  carriers?: string[];
  customs_info?: any;
  insurance?: number;
}

class CarrierService {
  async getShippingRates(request: ShippingRequest): Promise<ShippingRate[]> {
    try {
      console.log('CarrierService: Fetching shipping rates...', request);
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: request
      });

      if (error) {
        console.error('CarrierService: Error fetching rates:', error);
        throw new Error(`Failed to fetch shipping rates: ${error.message}`);
      }

      if (!data?.rates) {
        console.warn('CarrierService: No rates returned from API');
        return [];
      }

      console.log(`CarrierService: Received ${data.rates.length} rates (UPS: ${data.includes_ups ? 'Yes' : 'No'}, EasyPost: ${data.includes_easypost ? 'Yes' : 'No'})`);
      return data.rates;
    } catch (error) {
      console.error('CarrierService: Error in getShippingRates:', error);
      throw error;
    }
  }

  async createLabel(shipmentId: string, rateId: string, options?: any): Promise<any> {
    try {
      console.log('CarrierService: Creating label...', { shipmentId, rateId, options });
      
      // Determine which service to use based on rate ID
      let endpoint = 'create-label';
      
      if (rateId.includes('ups_')) {
        endpoint = 'create-ups-label';
        console.log('CarrierService: Using UPS label creation');
      } else if (options?.isInternational) {
        endpoint = 'create-international-label';
        console.log('CarrierService: Using international label creation');
      }
      
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { 
          shipmentId, 
          rateId, 
          options: options || {} 
        }
      });

      if (error) {
        console.error(`CarrierService: Error creating label via ${endpoint}:`, error);
        throw new Error(`Failed to create label: ${error.message}`);
      }

      console.log(`CarrierService: Label created successfully via ${endpoint}`);
      return data;
    } catch (error) {
      console.error('CarrierService: Error in createLabel:', error);
      throw error;
    }
  }

  async trackShipment(trackingCode: string, carrier?: string): Promise<any> {
    try {
      console.log('CarrierService: Tracking shipment...', { trackingCode, carrier });
      
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { trackingCode, carrier }
      });

      if (error) {
        console.error('CarrierService: Error tracking shipment:', error);
        throw new Error(`Failed to track shipment: ${error.message}`);
      }

      console.log('CarrierService: Tracking information retrieved successfully');
      return data;
    } catch (error) {
      console.error('CarrierService: Error in trackShipment:', error);
      throw error;
    }
  }
}

export const carrierService = new CarrierService();

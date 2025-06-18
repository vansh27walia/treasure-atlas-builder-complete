
import { supabase } from '@/integrations/supabase/client';

export interface AddressData {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface ParcelData {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface ShippingOption {
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

export interface ShippingRequestData {
  fromAddress: AddressData;
  toAddress: AddressData;
  parcel: ParcelData;
  options?: Record<string, any>;
}

export interface PickupRequestData {
  carrierCode: string;
  shipmentIds: string[];
  pickupAddress: AddressData;
  pickupDate: string;
  pickupTimeWindow: {
    start: string;
    end: string;
  };
  instructions?: string;
  packageCount: number;
}

export type CarrierType = 'easypost' | 'ups' | 'dhl';

// Common carrier service interface
class CarrierService {
  /**
   * Fetches shipping rates from EasyPost
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      console.log('CarrierService: Getting shipping rates', requestData);
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData
      });

      if (error) {
        console.error('CarrierService: Error fetching rates:', error);
        throw new Error(`Error fetching shipping rates: ${error.message}`);
      }

      console.log('CarrierService: Rates received:', data);
      return data.rates || [];
    } catch (error) {
      console.error('CarrierService: API error:', error);
      throw new Error('Failed to get shipping rates');
    }
  }
  
  /**
   * Creates a shipping label
   */
  public async createLabel(shipmentId: string, rateId: string, options?: any): Promise<{
    labelUrl: string;
    trackingCode: string;
  }> {
    try {
      console.log('CarrierService: Creating label', { shipmentId, rateId, options });
      
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { shipmentId, rateId, options: options || {} }
      });

      if (error) {
        console.error('CarrierService: Error creating label:', error);
        throw new Error(`Error creating label: ${error.message}`);
      }

      console.log('CarrierService: Label created:', data);
      return {
        labelUrl: data.labelUrl,
        trackingCode: data.trackingCode
      };
    } catch (error) {
      console.error('CarrierService: Error creating label:', error);
      throw new Error('Failed to generate shipping label');
    }
  }
  
  /**
   * Schedules a pickup
   */
  public async schedulePickup(pickupData: PickupRequestData): Promise<{
    pickupId: string;
    confirmation: string;
    scheduledDate: string;
    carrier: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('schedule-pickup', {
        body: pickupData
      });

      if (error) {
        throw new Error(`Error scheduling pickup: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      throw new Error('Failed to schedule pickup');
    }
  }
  
  /**
   * Verify an address using the carrier's API
   */
  public async verifyAddress(address: AddressData, carrier: CarrierType = 'easypost'): Promise<AddressData> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-address', {
        body: { address, carrier }
      });

      if (error) {
        throw new Error(`Error verifying address: ${error.message}`);
      }

      return data.verifiedAddress;
    } catch (error) {
      console.error('Error verifying address:', error);
      throw new Error('Failed to verify address');
    }
  }
}

export const carrierService = new CarrierService();

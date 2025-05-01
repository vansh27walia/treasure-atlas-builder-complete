
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

export type CarrierType = 'easypost' | 'ups';

// Common carrier service interface
class CarrierService {
  /**
   * Fetches shipping rates from EasyPost and UPS and combines them
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      // First get EasyPost rates
      const easyPostRates = await this.getEasyPostRates(requestData);
      
      // Then get UPS rates (to be implemented)
      // For now, we'll just return the EasyPost rates
      // const upsRates = await this.getUPSRates(requestData);
      
      // Return combined rates
      // return [...easyPostRates, ...upsRates];
      return easyPostRates;
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      throw new Error('Failed to get shipping rates');
    }
  }
  
  /**
   * Fetches shipping rates from EasyPost
   */
  private async getEasyPostRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData,
      });

      if (error) {
        throw new Error(`Error fetching EasyPost rates: ${error.message}`);
      }

      return data.rates;
    } catch (error) {
      console.error('EasyPost API error:', error);
      throw new Error('Failed to get EasyPost shipping rates');
    }
  }
  
  /**
   * Fetches shipping rates from UPS (to be implemented)
   */
  private async getUPSRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    // This will be implemented when UPS API integration is ready
    // For now, return an empty array
    return [];
  }
  
  /**
   * Creates a shipping label
   */
  public async createLabel(shipmentId: string, rateId: string, carrier: CarrierType = 'easypost'): Promise<{
    labelUrl: string;
    trackingCode: string;
  }> {
    try {
      // For now, only EasyPost is implemented
      if (carrier === 'easypost') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId }
        });

        if (error) {
          throw new Error(`Error creating label: ${error.message}`);
        }

        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      }
      
      // UPS implementation will be added later
      throw new Error('Selected carrier is not supported yet');
    } catch (error) {
      console.error('Error creating label:', error);
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
      // This will be implemented with a new Edge Function
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
}

export const carrierService = new CarrierService();

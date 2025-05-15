import { supabase } from '@/integrations/supabase/client';
import { ShippingOption } from '@/types/shipping';

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
   * Fetches shipping rates from EasyPost, UPS and DHL and combines them
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      console.log('Getting shipping rates for:', requestData);
      
      // First get EasyPost rates
      const easyPostRates = await this.getEasyPostRates(requestData);
      console.log('EasyPost rates received:', easyPostRates.length);
      
      // Try to get UPS rates if available
      let upsRates: ShippingOption[] = [];
      try {
        upsRates = await this.getUPSRates(requestData);
        console.log('UPS rates received:', upsRates.length);
      } catch (error) {
        console.log('UPS API may not be configured yet:', error);
      }
      
      // Try to get DHL rates if available
      let dhlRates: ShippingOption[] = [];
      try {
        dhlRates = await this.getDHLRates(requestData);
        console.log('DHL rates received:', dhlRates.length);
      } catch (error) {
        console.log('DHL API may not be configured yet:', error);
      }
      
      // Combine all rates
      const allRates = [...easyPostRates, ...upsRates, ...dhlRates];
      console.log('Total combined rates:', allRates.length);
      
      return allRates;
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
      console.log('Calling get-shipping-rates edge function');
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { ...requestData, carrier: 'easypost' }
      });

      if (error) {
        console.error('Error from get-shipping-rates function:', error);
        throw new Error(`Error fetching EasyPost rates: ${error.message}`);
      }

      if (!data || !data.rates) {
        console.error('No rates returned from edge function:', data);
        return [];
      }

      console.log('EasyPost rates returned from edge function:', data.rates.length);
      return data.rates;
    } catch (error) {
      console.error('EasyPost API error:', error);
      throw new Error('Failed to get EasyPost shipping rates');
    }
  }
  
  /**
   * Fetches shipping rates from UPS
   */
  private async getUPSRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { ...requestData, carrier: 'ups' }
      });

      if (error) {
        throw new Error(`Error fetching UPS rates: ${error.message}`);
      }

      return data.rates || [];
    } catch (error) {
      console.error('UPS API error:', error);
      // For now, return empty array instead of throwing
      return [];
    }
  }
  
  /**
   * Fetches shipping rates from DHL
   */
  private async getDHLRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { ...requestData, carrier: 'dhl' }
      });

      if (error) {
        throw new Error(`Error fetching DHL rates: ${error.message}`);
      }

      return data.rates || [];
    } catch (error) {
      console.error('DHL API error:', error);
      // For now, return empty array instead of throwing
      return [];
    }
  }
  
  /**
   * Creates a shipping label
   */
  public async createLabel(shipmentId: string, rateId: string, carrier: CarrierType = 'easypost'): Promise<{
    labelUrl: string;
    trackingCode: string;
  }> {
    try {
      // Handle different carrier APIs
      if (carrier === 'easypost') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId, carrier: 'easypost' }
        });

        if (error) {
          throw new Error(`Error creating label: ${error.message}`);
        }

        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      } else if (carrier === 'ups') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId, carrier: 'ups' }
        });

        if (error) {
          throw new Error(`Error creating UPS label: ${error.message}`);
        }

        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      } else if (carrier === 'dhl') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId, carrier: 'dhl' }
        });

        if (error) {
          throw new Error(`Error creating DHL label: ${error.message}`);
        }

        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      }
      
      // Fallback for unsupported carrier
      throw new Error('Selected carrier is not supported yet');
    } catch (error) {
      console.error('Error creating label:', error);
      throw new Error('Failed to generate shipping label');
    }
  }
  
  /**
   * Creates an international shipping label
   */
  public async createInternationalLabel(shipmentId: string, rateId: string, options: Record<string, any> = {}): Promise<{
    labelUrl: string;
    trackingCode: string;
    shipmentId: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('create-international-label', {
        body: { shipmentId, rateId, options }
      });

      if (error) {
        throw new Error(`Error creating international label: ${error.message}`);
      }

      return {
        labelUrl: data.labelUrl,
        trackingCode: data.trackingCode,
        shipmentId: data.shipmentId
      };
    } catch (error) {
      console.error('Error creating international label:', error);
      throw new Error('Failed to generate international shipping label');
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

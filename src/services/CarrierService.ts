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
   * Fetches shipping rates from EasyPost, UPS and DHL and combines them
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      // Ensure tracking is always enabled in the request
      const enhancedRequestData = {
        ...requestData,
        options: {
          ...requestData.options,
          tracking: true, // Always enable tracking in backend
        }
      };

      // First get EasyPost rates
      const easyPostRates = await this.getEasyPostRates(enhancedRequestData);
      
      // Try to get UPS rates if available
      let upsRates: ShippingOption[] = [];
      try {
        upsRates = await this.getUPSRates(enhancedRequestData);
      } catch (error) {
        console.log('UPS API may not be configured yet:', error);
      }
      
      // Try to get DHL rates if available
      let dhlRates: ShippingOption[] = [];
      try {
        dhlRates = await this.getDHLRates(enhancedRequestData);
      } catch (error) {
        console.log('DHL API may not be configured yet:', error);
      }
      
      // Return combined rates
      return [...easyPostRates, ...upsRates, ...dhlRates];
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
        body: { ...requestData, carrier: 'easypost' }
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
   * Creates a shipping label and automatically saves tracking data with user association
   * Tracking is automatically enabled for all shipments
   */
  public async createLabel(shipmentId: string, rateId: string, carrier: CarrierType = 'easypost'): Promise<{
    labelUrl: string;
    trackingCode: string;
  }> {
    try {
      // Always include tracking options
      const labelOptions = {
        shipmentId, 
        rateId, 
        carrier,
        options: {
          tracking: true, // Always enable tracking
          insurance: 100, // Default $100 insurance
        }
      };

      // Handle different carrier APIs
      if (carrier === 'easypost') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: labelOptions
        });

        if (error) {
          throw new Error(`Error creating label: ${error.message}`);
        }

        // The edge function should handle saving the tracking record with user_id
        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      } else if (carrier === 'ups') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: labelOptions
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
          body: labelOptions
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
   * Schedules a pickup with enhanced error handling and real API integration
   */
  public async schedulePickup(pickupData: PickupRequestData): Promise<{
    pickupId: string;
    confirmation: string;
    scheduledDate: string;
    carrier: string;
    status: string;
    address: AddressData;
    timeWindow: {
      start: string;
      end: string;
    };
    packageCount: number;
    message: string;
    pickupFee?: number;
    estimatedWindow?: string;
    easypostData?: any;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('schedule-pickup', {
        body: pickupData
      });

      if (error) {
        // Handle specific error types
        if (error.message.includes('Invalid pickup time window')) {
          throw new Error('The selected pickup time window is invalid. Please choose different times.');
        } else if (error.message.includes('Invalid pickup address')) {
          throw new Error('The pickup address is invalid. Please verify the address details.');
        } else if (error.message.includes('No valid shipments found')) {
          throw new Error('No valid shipments found for pickup. Please select valid tracking numbers.');
        } else if (error.message.includes('EasyPost API key not configured')) {
          throw new Error('Pickup service is not properly configured. Please contact support.');
        }
        
        throw new Error(`Error scheduling pickup: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Network error occurred. Please check your connection and try again.');
        } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
          throw new Error('Authentication failed. Please sign in again.');
        }
        throw error;
      }
      
      throw new Error('Failed to schedule pickup. Please try again later.');
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

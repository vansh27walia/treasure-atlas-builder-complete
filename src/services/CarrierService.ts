
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
  carrier?: string; // Optional carrier filter
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

export type CarrierType = 'easypost' | 'ups' | 'dhl' | 'usps' | 'fedex' | 'all';

// Common carrier service interface
class CarrierService {
  /**
   * Fetches shipping rates from all configured carriers
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const selectedCarrier = requestData.carrier || 'all';
      let allRates: ShippingOption[] = [];
      
      // If specific carrier is selected or 'all'
      if (selectedCarrier === 'all' || selectedCarrier === 'easypost') {
        const easyPostRates = await this.getEasyPostRates(requestData);
        allRates = [...allRates, ...easyPostRates];
      }
      
      if (selectedCarrier === 'all' || selectedCarrier === 'ups') {
        try {
          const upsRates = await this.getUPSRates(requestData);
          allRates = [...allRates, ...upsRates];
        } catch (error) {
          console.log('UPS API may not be configured yet:', error);
        }
      }
      
      if (selectedCarrier === 'all' || selectedCarrier === 'dhl') {
        try {
          const dhlRates = await this.getDHLRates(requestData);
          allRates = [...allRates, ...dhlRates];
        } catch (error) {
          console.log('DHL API may not be configured yet:', error);
        }
      }
      
      if (selectedCarrier === 'all' || selectedCarrier === 'fedex') {
        try {
          const fedexRates = await this.getFedExRates(requestData);
          allRates = [...allRates, ...fedexRates];
        } catch (error) {
          console.log('FedEx API may not be configured yet:', error);
        }
      }
      
      if (selectedCarrier === 'all' || selectedCarrier === 'usps') {
        try {
          const uspsRates = await this.getUSPSRates(requestData);
          allRates = [...allRates, ...uspsRates];
        } catch (error) {
          console.log('USPS API may not be configured yet:', error);
        }
      }
      
      // Return combined and sorted rates
      return allRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
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

      return data.rates || [];
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
      return []; // Return empty array instead of throwing
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
      return []; // Return empty array instead of throwing
    }
  }
  
  /**
   * Fetches shipping rates from FedEx
   */
  private async getFedExRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { ...requestData, carrier: 'fedex' }
      });

      if (error) {
        throw new Error(`Error fetching FedEx rates: ${error.message}`);
      }

      return data.rates || [];
    } catch (error) {
      console.error('FedEx API error:', error);
      return []; // Return empty array instead of throwing
    }
  }
  
  /**
   * Fetches shipping rates from USPS
   */
  private async getUSPSRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: { ...requestData, carrier: 'usps' }
      });

      if (error) {
        throw new Error(`Error fetching USPS rates: ${error.message}`);
      }

      return data.rates || [];
    } catch (error) {
      console.error('USPS API error:', error);
      return []; // Return empty array instead of throwing
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
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { shipmentId, rateId, carrier }
      });

      if (error) {
        throw new Error(`Error creating label: ${error.message}`);
      }

      if (!data || !data.labelUrl) {
        throw new Error("No label data returned from server");
      }

      return {
        labelUrl: data.labelUrl,
        trackingCode: data.trackingCode
      };
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
  
  /**
   * Get available carriers for selection
   */
  public getAvailableCarriers(): Array<{id: string, name: string}> {
    return [
      { id: 'all', name: 'All Carriers' },
      { id: 'easypost', name: 'EasyPost' },
      { id: 'ups', name: 'UPS' },
      { id: 'usps', name: 'USPS' },
      { id: 'fedex', name: 'FedEx' },
      { id: 'dhl', name: 'DHL' }
    ];
  }
}

export const carrierService = new CarrierService();

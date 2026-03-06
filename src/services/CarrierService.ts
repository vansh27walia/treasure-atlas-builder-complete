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
  original_carrier?: string; // Keep track of original carrier name for API calls
  markup_percentage?: number; // Include markup info
  original_rate?: string; // Store original rate before markup
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

// Standardize carrier names for consistent display across the application
const standardizeCarrierName = (carrierName: string): string => {
  const name = carrierName.toUpperCase();
  if (name.includes('USPS')) return 'USPS';
  if (name.includes('UPS')) return 'UPS';
  if (name.includes('FEDEX')) return 'FedEx';
  if (name.includes('DHL')) return 'DHL';
  if (name.includes('CANADA POST') || name.includes('CANADAPOST')) return 'Canada Post';
  return carrierName; // Return original if no match
};

// Common carrier service interface
class CarrierService {
  /**
   * Fetches shipping rates with markup applied from backend
   */
  public async getShippingRates(requestData: ShippingRequestData): Promise<ShippingOption[]> {
    try {
      // Ensure from address has phone number for international shipments
      const enhancedRequestData = {
        ...requestData,
        fromAddress: {
          ...requestData.fromAddress,
          phone: requestData.fromAddress.phone || '+1-555-555-5555' // Fallback if missing
        }
      };

      console.log('Fetching shipping rates with markup applied...');

      // Get rates with markup applied from backend (now includes UPS for international)
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: enhancedRequestData
      });

      if (error) {
        console.error('Error fetching shipping rates:', error);
        throw new Error(`Error fetching shipping rates: ${error.message}`);
      }

      const includesUps = data.includes_ups ? ' (including UPS for international)' : '';
      console.log(`Received ${data.rates?.length || 0} rates with markup applied${includesUps}:`, data.markup_applied);

      // Process and standardize all rates (rates already have markup applied from backend)
      const allRates = (data.rates || []).map(rate => ({
        ...rate,
        carrier: standardizeCarrierName(rate.carrier),
        original_carrier: rate.carrier, // Keep original for API compatibility
        // Rate and original_rate are already set by backend with markup
        markup_percentage: rate.markup_percentage || 0
      }));

      return allRates;
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      throw new Error('Failed to get shipping rates');
    }
  }
  
  /**
   * Fetches shipping rates with customs validation for international shipments
   */
  public async getShippingRatesWithCustoms(requestData: ShippingRequestData, customsData?: any): Promise<ShippingOption[]> {
    try {
      console.log('Fetching shipping rates with customs validation and markup...');

      const { data, error } = await supabase.functions.invoke('calculate-shipping-rate-with-customs', {
        body: {
          ...requestData,
          customsData
        }
      });

      if (error) {
        console.error('Error fetching shipping rates with customs:', error);
        throw new Error(`Error fetching shipping rates: ${error.message}`);
      }

      console.log(`Received ${data.rates?.length || 0} rates with customs validation and markup:`, data.markup_applied);

      // Rates already have markup applied from backend
      return data.rates.map(rate => ({
        ...rate,
        carrier: standardizeCarrierName(rate.carrier),
        original_carrier: rate.original_carrier || rate.carrier
      }));
    } catch (error) {
      console.error('Error fetching shipping rates with customs:', error);
      throw new Error('Failed to get shipping rates with customs validation');
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
   * Creates a shipping label with customs info and automatically saves tracking data with user association
   */
  public async createLabel(shipmentId: string, rateId: string, customsInfo?: any, carrier: CarrierType = 'easypost', shopifyMeta?: { shopify_order_id?: string; shopify_shop?: string }): Promise<{
    labelUrl: string;
    trackingCode: string;
    chargedRate?: string;
    originalRate?: string;
    markupApplied?: string;
  }> {
    try {
      // Dispatch payment start event to close AI panel
      document.dispatchEvent(new CustomEvent('payment-start'));

      console.log('Creating label with markup applied to billing...');

      // Check if this is a UPS rate (for international shipments)
      if (rateId.startsWith('ups_')) {
        console.log('Creating UPS label for international shipment...');
        
        // Extract service code from UPS rate ID
        const serviceCode = rateId.split('_')[1];
        
        // We need to reconstruct shipment data for UPS
        // This would need to be passed from the frontend or stored in session
        const shipmentData = this.getStoredShipmentData(shipmentId);
        
        const { data, error } = await supabase.functions.invoke('create-ups-label', {
          body: { 
            shipmentData,
            serviceCode,
            customsInfo 
          }
        });

        if (error) {
          document.dispatchEvent(new CustomEvent('payment-cancelled'));
          throw new Error(`Error creating UPS label: ${error.message}`);
        }

        document.dispatchEvent(new CustomEvent('payment-complete'));
        
        console.log('UPS label created successfully');
        
        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      }

      // Handle different carrier APIs with customs support (existing EasyPost flow)
      if (carrier === 'easypost') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { 
            shipmentId, 
            rateId, 
            carrier: 'easypost',
            customsInfo 
          }
        });

        if (error) {
          document.dispatchEvent(new CustomEvent('payment-cancelled'));
          throw new Error(`Error creating label: ${error.message}`);
        }

        // The edge function handles saving the tracking record with user_id and markup
        document.dispatchEvent(new CustomEvent('payment-complete'));
        
        console.log('Label created successfully with markup:', data.markupApplied);
        
        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode,
          chargedRate: data.chargedRate,
          originalRate: data.originalRate,
          markupApplied: data.markupApplied
        };
      } else if (carrier === 'ups') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId, carrier: 'ups' }
        });

        if (error) {
          document.dispatchEvent(new CustomEvent('payment-cancelled'));
          throw new Error(`Error creating UPS label: ${error.message}`);
        }

        document.dispatchEvent(new CustomEvent('payment-complete'));
        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      } else if (carrier === 'dhl') {
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId, carrier: 'dhl' }
        });

        if (error) {
          document.dispatchEvent(new CustomEvent('payment-cancelled'));
          throw new Error(`Error creating DHL label: ${error.message}`);
        }

        document.dispatchEvent(new CustomEvent('payment-complete'));
        return {
          labelUrl: data.labelUrl,
          trackingCode: data.trackingCode
        };
      }
      
      // Fallback for unsupported carrier
      document.dispatchEvent(new CustomEvent('payment-cancelled'));
      throw new Error('Selected carrier is not supported yet');
    } catch (error) {
      console.error('Error creating label:', error);
      document.dispatchEvent(new CustomEvent('payment-cancelled'));
      throw new Error('Failed to generate shipping label');
    }
  }

  // Helper method to get stored shipment data (you might want to store this in sessionStorage or pass it differently)
  private getStoredShipmentData(shipmentId: string): any {
    // This is a placeholder - you'll need to implement proper shipment data storage/retrieval
    const storedData = sessionStorage.getItem(`shipment_${shipmentId}`);
    if (storedData) {
      return JSON.parse(storedData);
    }
    
    // Fallback - this should be implemented based on your needs
    throw new Error('Shipment data not found for UPS label creation');
  }
  
  /**
   * Creates bulk labels with customs info
   */
  public async createBulkLabels(shipments: any[], labelOptions?: any): Promise<any> {
    try {
      console.log('Creating bulk labels with markup applied...');

      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: { 
          shipments, 
          labelOptions 
        }
      });

      if (error) {
        throw new Error(`Error creating bulk labels: ${error.message}`);
      }

      console.log('Bulk labels created successfully with markup:', data.markupApplied);
      return data;
    } catch (error) {
      console.error('Error creating bulk labels:', error);
      throw new Error('Failed to create bulk labels');
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

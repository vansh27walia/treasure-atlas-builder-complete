
import { supabase } from '@/integrations/supabase/client';

export interface GeneratedAddress {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

export class GeocodingService {
  private static async getGoogleApiKey(): Promise<string> {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required to access Google Maps API');
    }
    
    const { data, error } = await supabase.functions.invoke('get-google-api-key', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (error || !data?.apiKey) {
      throw new Error('Google Maps API key not configured');
    }
    
    return data.apiKey;
  }

  public static async generateAddressFromZip(zipCode: string): Promise<GeneratedAddress> {
    try {
      console.log('Generating address for ZIP code:', zipCode);
      
      const apiKey = await this.getGoogleApiKey();
      
      // Use Google Geocoding API to get address from ZIP code
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address from Google Maps API');
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`No address found for ZIP code: ${zipCode}`);
      }
      
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      // Extract address components
      let street1 = '';
      let city = '';
      let state = '';
      let country = 'US';
      
      // Parse address components
      for (const component of addressComponents) {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        } else if (types.includes('route')) {
          street1 = component.long_name;
        } else if (types.includes('street_number')) {
          street1 = component.long_name + (street1 ? ' ' + street1 : '');
        }
      }
      
      // If no specific street found, use a generic one
      if (!street1) {
        street1 = 'Main Street';
      }
      
      const generatedAddress: GeneratedAddress = {
        name: 'Rate Calculator',
        street1,
        city,
        state,
        zip: zipCode,
        country,
        phone: '555-555-5555'
      };
      
      console.log('Generated address:', generatedAddress);
      return generatedAddress;
      
    } catch (error) {
      console.error('Error generating address from ZIP:', error);
      throw new Error(`Failed to generate address for ZIP code ${zipCode}: ${error.message}`);
    }
  }
}

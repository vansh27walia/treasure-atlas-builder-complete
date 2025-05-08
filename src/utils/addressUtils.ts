
import { supabase } from '@/integrations/supabase/client';

// Define types for Google Maps API
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: object) => any;
          AutocompleteService: any;
          PlacesService: any;
        };
      };
    };
  }
}

/**
 * Loads the Google Maps API with Places library
 */
export const loadGoogleMapsAPI = async (): Promise<boolean> => {
  // If already loaded, return true
  if (window.google && window.google.maps && window.google.maps.places) {
    return true;
  }

  try {
    // Get API key from Supabase securely
    const { data, error } = await supabase.functions.invoke('get-google-api-key');
    
    if (error || !data || !data.apiKey) {
      console.error('Error retrieving Google API key:', error);
      return false;
    }
    
    const apiKey = data.apiKey;
    
    return new Promise((resolve) => {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve(true);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        resolve(false);
      };
      
      // Add script to document
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error in loadGoogleMapsAPI:', error);
    return false;
  }
};

/**
 * Initializes Google Places Autocomplete on an input element
 */
export const initAddressAutocomplete = (inputElement: HTMLInputElement, onPlaceSelected?: (place: any) => void) => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.warn('Google Maps API not loaded. Cannot initialize autocomplete.');
    return null;
  }
  
  const options = {
    componentRestrictions: { country: 'us' },
    fields: ['address_components', 'formatted_address', 'geometry'],
  };
  
  const autocomplete = new window.google.maps.places.Autocomplete(inputElement, options);
  
  if (onPlaceSelected) {
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    });
  }
  
  return autocomplete;
};

/**
 * Extracts address components from a Google Place result
 */
export const extractAddressComponents = (place: any) => {
  if (!place || !place.address_components) {
    return {};
  }
  
  const addressComponents = place.address_components;
  const result: Record<string, string> = {};
  
  // Map Google address components to our format
  for (const component of addressComponents) {
    const types = component.types;
    
    if (types.includes('street_number')) {
      result.streetNumber = component.long_name;
    } else if (types.includes('route')) {
      result.street = component.long_name;
    } else if (types.includes('locality')) {
      result.city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name;
    } else if (types.includes('postal_code')) {
      result.zip = component.long_name;
    } else if (types.includes('country')) {
      result.country = component.short_name;
    }
  }
  
  // Combine street number and street for street1
  if (result.streetNumber && result.street) {
    result.street1 = `${result.streetNumber} ${result.street}`;
  }
  
  return result;
};

/**
 * Format an address object into a readable string
 */
export const formatAddress = (address: any): string => {
  if (!address) return '';
  
  const parts = [];
  
  if (address.street1) parts.push(address.street1);
  if (address.street2) parts.push(address.street2);
  
  const cityStateZip = [
    address.city, 
    address.state ? `${address.state}` : '', 
    address.zip
  ].filter(Boolean).join(', ');
  
  if (cityStateZip) parts.push(cityStateZip);
  if (address.country && address.country !== 'US') parts.push(address.country);
  
  return parts.join(', ');
};

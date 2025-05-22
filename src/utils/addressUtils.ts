import { supabase } from '@/integrations/supabase/client';
import { GoogleApiKeyResponse } from '@/types/shipping';
import { SavedAddress } from '@/services/AddressService';

// Helper function to create address selection handlers
export const createAddressSelectHandler = (setAddressState: React.Dispatch<React.SetStateAction<SavedAddress | null>>) => {
  return (address: SavedAddress | null) => {
    setAddressState(address);
  };
};

// Function to load the Google Maps API
export const loadGoogleMapsAPI = async (): Promise<boolean> => {
  try {
    // First, check if the API is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps API already loaded');
      return true;
    }
    
    // Try to get the API key from Supabase edge function
    const { data, error } = await supabase.functions.invoke('get-google-api-key', {
      body: {}
    });
    
    if (error) {
      console.error('Error fetching Google API key:', error);
      return false;
    }
    
    const response = data as GoogleApiKeyResponse;
    
    if (!response.apiKey) {
      console.error('No API key returned from server');
      return false;
    }
    
    const apiKey = response.apiKey;
    
    // Load the Google Maps API
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      
      // Define the callback function
      window.initGoogleMapsCallback = () => {
        console.log('Google Maps API loaded successfully');
        resolve(true);
        delete window.initGoogleMapsCallback;
      };
      
      // Handle loading errors
      script.onerror = () => {
        console.error('Error loading Google Maps API');
        resolve(false);
      };
      
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error in loadGoogleMapsAPI:', error);
    return false;
  }
};

// Function to initialize Google Places Autocomplete on an input field
export const initAddressAutocomplete = (
  inputElement: HTMLInputElement, 
  callback: (place: GoogleMapsPlace) => void,
  options: {
    types?: string[];
    componentRestrictions?: { country: string | string[] };
  } = {}
): GoogleMapsAutocomplete | null => {
  try {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API not loaded');
      return null;
    }
    
    // Default options for autocomplete
    const defaultOptions = {
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address'],
    };
    
    // Merge default options with provided options
    const autocompleteOptions = {
      ...defaultOptions,
      ...options,
    };
    
    // Create the autocomplete instance
    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, autocompleteOptions);
    
    // Add listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place) {
        callback(place);
      }
    });
    
    return autocomplete;
  } catch (error) {
    console.error('Error initializing address autocomplete:', error);
    return null;
  }
};

// Extract address components from Google Place result
export function extractAddressComponents(place: GoogleMapsPlace): {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} {
  let street_number = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';
  let country = 'US';
  
  // Extract each component
  if (place.address_components) {
    place.address_components.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        street_number = component.long_name;
      } else if (types.includes('route')) {
        route = component.long_name;
      } else if (types.includes('locality') || types.includes('sublocality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        zip = component.long_name;
      } else if (types.includes('country')) {
        country = component.short_name;
      }
    });
  }
  
  // Combine street number and route for street address
  const street1 = street_number && route ? `${street_number} ${route}` : (route || place.formatted_address?.split(',')[0] || '');
  
  return {
    street1,
    city,
    state,
    zip,
    country
  };
}

// Initialize Google Places Autocomplete for international addresses
export const initInternationalAddressAutocomplete = (
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: GoogleMapsPlace) => void
): GoogleMapsAutocomplete | null => {
  return initAddressAutocomplete(inputElement, onPlaceSelected, {
    types: ['address'],
    // No country restrictions for international addresses
  });
};

// Initialize Google Places Autocomplete for domestic addresses (US only)
export const initDomesticAddressAutocomplete = (
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: GoogleMapsPlace) => void
): GoogleMapsAutocomplete | null => {
  return initAddressAutocomplete(inputElement, onPlaceSelected, {
    types: ['address'],
    componentRestrictions: { country: 'us' }
  });
};

// Function to populate shipping forms with saved address data
export const populateShippingFormWithAddress = (
  formSetValues: (values: Record<string, any>) => void,
  address: SavedAddress
) => {
  if (!address) return;
  
  formSetValues({
    name: address.name || '',
    company: address.company || '',
    street1: address.street1,
    street2: address.street2 || '',
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country || 'US',
    phone: address.phone || '',
  });
};

// Function to create a consistent address display string
export function formatAddressForDisplay(address: any): string {
  if (!address) return '';
  
  const parts = [
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country !== 'US' ? address.country : null
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Function to load pickup addresses for a specific user and auto-select the default
export const loadAndSelectDefaultPickupAddress = async (
  onAddressSelected: (address: SavedAddress | null) => void
): Promise<SavedAddress[]> => {
  try {
    const addressService = new (require('@/services/AddressService').AddressService)();
    const addresses = await addressService.getSavedAddresses();
    
    if (addresses && addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.is_default_from);
      
      if (defaultAddress) {
        onAddressSelected(defaultAddress);
      }
      
      return addresses;
    }
    
    return [];
  } catch (error) {
    console.error('Error loading pickup addresses:', error);
    return [];
  }
};

// Add the getCarrierLogoUrl utility function
export function getCarrierLogoUrl(carrier: string): string {
  const carrierLogos: Record<string, string> = {
    'USPS': 'https://www.usps.com/assets/images/home/usps-logo-2023.svg',
    'UPS': 'https://www.ups.com/assets/resources/images/UPS_logo.svg',
    'FedEx': 'https://www.fedex.com/content/dam/fedex-com/logos/logo.png',
    'DHL': 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg'
  };
  
  return carrierLogos[carrier] || '';
}

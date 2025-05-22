
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
  onPlaceSelected: (place: GoogleMapsPlace) => void,
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
        onPlaceSelected(place);
      }
    });
    
    return autocomplete;
  } catch (error) {
    console.error('Error initializing address autocomplete:', error);
    return null;
  }
};

// Extract address components from Google Place result
export const extractAddressComponents = (place: GoogleMapsPlace): {
  street1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
} => {
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
};

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

// Get carrier logo URL based on carrier name
export const getCarrierLogoUrl = (carrier: string): string => {
  const normalizedCarrier = carrier.toLowerCase();
  
  // Map of carrier names to their logo URLs
  const carrierLogos: Record<string, string> = {
    'usps': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/USPS_eagle_logo.svg',
    'ups': 'https://upload.wikimedia.org/wikipedia/commons/6/6b/United_Parcel_Service_logo_2014.svg',
    'fedex': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/FedEx_Ground_logo.svg',
    'dhl': 'https://upload.wikimedia.org/wikipedia/commons/5/5d/DHL_Logo.svg',
    'ontrac': 'https://www.ontrac.com/images/ontrac-logo.png',
    'lasership': 'https://www.lasership.com/wp-content/uploads/2022/05/LS_horizontal-blue-yellow.svg',
    'amazon': 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  };
  
  // Check if the carrier is in our map, accounting for partial matches
  let logoUrl = '';
  
  Object.keys(carrierLogos).forEach(key => {
    if (normalizedCarrier.includes(key)) {
      logoUrl = carrierLogos[key];
    }
  });
  
  // Return logo URL or empty string if not found
  return logoUrl;
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

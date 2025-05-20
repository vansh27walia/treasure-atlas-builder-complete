import { CARRIER_OPTIONS } from '@/types/shipping';
import { GoogleApiKeyResponse } from '@/types/shipping';

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
export const getCarrierLogoUrl = (carrierId: string): string | null => {
  const carrierId_lower = carrierId.toLowerCase();
  
  if (carrierId_lower.includes('usps')) {
    return '/carrier_logos/usps.png';
  } else if (carrierId_lower.includes('ups')) {
    return '/carrier_logos/ups.png';
  } else if (carrierId_lower.includes('fedex')) {
    return '/carrier_logos/fedex.png';
  } else if (carrierId_lower.includes('dhl')) {
    return '/carrier_logos/dhl.png';
  }
  
  return null;
};

// Format address string
export const formatAddress = (address: any): string => {
  if (!address) return '';
  
  const parts = [
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country
  ].filter(Boolean);
  
  return parts.join(', ');
};

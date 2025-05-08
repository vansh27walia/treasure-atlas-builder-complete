
import { toast } from '@/components/ui/sonner';
import { SimpleAddress } from '@/components/shipping/AddressSelector';

interface PlacePrediction {
  description: string;
  place_id: string;
}

interface GooglePlaceResult {
  address_components?: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address?: string;
}

// Function to load Google Maps API
export const loadGoogleMapsAPI = async (): Promise<boolean> => {
  // If Google API is already loaded, return true
  if (window.google && window.google.maps) {
    return true;
  }

  // Try to get the API key from localStorage
  const googleApiKey = localStorage.getItem('google_api_key');
  
  if (!googleApiKey) {
    console.log('Google Places API key not found in localStorage');
    return false;
  }

  return new Promise((resolve) => {
    // Create a script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`;
    
    // Execute callback when script is loaded
    script.onload = () => {
      console.log('Google Places API loaded successfully');
      resolve(true);
    };
    
    // Handle script load failure
    script.onerror = () => {
      console.error('Failed to load Google Places API');
      toast.error('Failed to load address autocomplete service');
      resolve(false);
    };
    
    // Append script to document
    document.head.appendChild(script);
  });
};

// Initialize Google Places Autocomplete
export const initAddressAutocomplete = (
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: GooglePlaceResult | null) => void
) => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Places API not loaded');
    return;
  }

  try {
    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      types: ['address'],
      componentRestrictions: { country: 'us' }, // Restrict to US addresses
      fields: ['address_components', 'formatted_address']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelected(place);
    });

    // Prevent form submission when Enter is pressed in the autocomplete field
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });

    return autocomplete;
  } catch (error) {
    console.error('Error initializing Google Places Autocomplete:', error);
    return null;
  }
};

// Extract address components from Google Places result
export const extractAddressComponents = (place: GooglePlaceResult): SimpleAddress => {
  if (!place.address_components) {
    return {};
  }

  const addressComponents = place.address_components;
  let streetNumber = '';
  let streetName = '';
  let city = '';
  let state = '';
  let zip = '';
  let country = 'US';

  // Extract each component
  for (const component of addressComponents) {
    const types = component.types;

    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      streetName = component.long_name;
    } else if (types.includes('locality') || types.includes('sublocality')) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name;
    } else if (types.includes('postal_code')) {
      zip = component.long_name;
    } else if (types.includes('country')) {
      country = component.short_name;
    }
  }

  // Construct the street address
  let street1 = '';
  if (streetNumber && streetName) {
    street1 = `${streetNumber} ${streetName}`;
  } else if (streetName) {
    street1 = streetName;
  }

  return {
    street1,
    city,
    state,
    zip,
    country,
  };
};

// Helper function to create address select handler
export const createAddressSelectHandler = (
  setFieldValue: (name: string, value: any) => void,
  prefix: string = ''
) => {
  return (address: SimpleAddress) => {
    if (address.name) setFieldValue(`${prefix}name`, address.name);
    if (address.company) setFieldValue(`${prefix}company`, address.company);
    if (address.street1) setFieldValue(`${prefix}street1`, address.street1);
    if (address.street2) setFieldValue(`${prefix}street2`, address.street2);
    if (address.city) setFieldValue(`${prefix}city`, address.city);
    if (address.state) setFieldValue(`${prefix}state`, address.state);
    if (address.zip) setFieldValue(`${prefix}zip`, address.zip);
    if (address.country) setFieldValue(`${prefix}country`, address.country);
    if (address.phone) setFieldValue(`${prefix}phone`, address.phone);
  };
};

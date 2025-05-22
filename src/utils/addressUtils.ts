
// Just updating the extractAddressComponents function to be more robust
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
  
  console.log('Extracting components from place:', place);
  
  try {
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
    
    // If city is still empty, try to get it from other address components
    if (!city) {
      place.address_components?.forEach(component => {
        if (component.types.includes('sublocality_level_1') || 
            component.types.includes('neighborhood') ||
            component.types.includes('postal_town')) {
          city = component.long_name;
        }
      });
    }
    
    // Combine street number and route for street address
    let street1 = '';
    if (street_number && route) {
      street1 = `${street_number} ${route}`;
    } else if (route) {
      street1 = route;
    } else if (place.formatted_address) {
      // Fallback to first line of formatted address
      const addressParts = place.formatted_address.split(',');
      street1 = addressParts[0] || '';
    }
    
    console.log("Extracted address components:", { street1, city, state, zip, country });
    
    return {
      street1,
      city,
      state,
      zip,
      country
    };
  } catch (error) {
    console.error('Error extracting address components:', error);
    // Return default empty values if extraction fails
    return {
      street1: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    };
  }
}

// Add Google Maps API loader function
export const loadGoogleMapsAPI = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // If Google Maps is already loaded, resolve immediately
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded");
      resolve(true);
      return;
    }

    // Create a global callback function
    window.initGoogleMapsCallback = () => {
      console.log("Google Maps API loaded");
      resolve(true);
    };

    // Function to handle script load error
    const handleScriptError = () => {
      console.error("Failed to load Google Maps API");
      reject(new Error("Failed to load Google Maps API"));
    };

    try {
      // Get API key from localStorage or environment
      const apiKey = localStorage.getItem('googleMapsApiKey') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn("No Google Maps API key found");
        // Continue without API key, which might work with restrictions
      }

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
      script.async = true;
      script.defer = true;
      script.onerror = handleScriptError;
      
      // Add script to document
      document.head.appendChild(script);
    } catch (error) {
      console.error("Error initializing Google Maps API:", error);
      reject(error);
    }
  });
};

// Function to get carrier logo URL
export const getCarrierLogoUrl = (carrier: string): string | null => {
  const carrierLower = carrier.toLowerCase();
  
  if (carrierLower.includes('usps')) {
    return "https://www.usps.com/assets/images/home/logo-sb.svg";
  } else if (carrierLower.includes('ups')) {
    return "https://www.ups.com/assets/resources/images/UPS_logo.svg";
  } else if (carrierLower.includes('fedex')) {
    return "https://www.fedex.com/content/dam/fedex-com/logos/logo.png";
  } else if (carrierLower.includes('dhl')) {
    return "https://www.dhl.com/img/meta/dhl-logo.png";
  }
  return null;
};

// Function to format address for display
export const formatAddressForDisplay = (address: any): string => {
  if (!address) return 'No address available';
  
  const parts = [];
  
  if (address.name) parts.push(address.name);
  if (address.street1) parts.push(address.street1);
  if (address.street2) parts.push(address.street2);
  if (address.city && address.state) parts.push(`${address.city}, ${address.state} ${address.zip || ''}`);
  else if (address.city) parts.push(address.city);
  if (address.country && address.country !== 'US') parts.push(address.country);
  
  return parts.join(', ');
};

// Function to initialize address autocomplete for a specific input element
export const initAddressAutocomplete = (
  inputElement: HTMLInputElement, 
  onPlaceSelected: (place: GoogleMapsPlace) => void
) => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error("Google Maps API not loaded");
    return null;
  }

  try {
    const options = {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address'],
    };

    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, options);
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.address_components) {
        onPlaceSelected(place);
      }
    });

    return autocomplete;
  } catch (error) {
    console.error("Error initializing address autocomplete:", error);
    return null;
  }
};

// Function to create an address select handler
export const createAddressSelectHandler = (form: any, onAddressSelect?: (address: any) => void) => {
  return (address: any) => {
    if (!address) return;
    
    if (form) {
      // Set form values from address
      if (address.street1) form.setValue('street1', address.street1);
      if (address.street2) form.setValue('street2', address.street2 || '');
      if (address.city) form.setValue('city', address.city);
      if (address.state) form.setValue('state', address.state);
      if (address.zip) form.setValue('zip', address.zip);
      if (address.country) form.setValue('country', address.country || 'US');

      // Trigger validation
      form.trigger(['street1', 'city', 'state', 'zip', 'country']);
    }
    
    // Call external handler if provided
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };
};

// Export SavedAddress type for components that need it
export interface SavedAddress {
  id: string;
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

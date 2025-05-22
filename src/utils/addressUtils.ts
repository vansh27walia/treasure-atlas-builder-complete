
import { SavedAddress } from '@/services/AddressService';

// Extract address components from Google Maps place result
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

// Get carrier logo URL based on carrier name
export function getCarrierLogoUrl(carrier: string): string | null {
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
}

// Format address for display
export function formatAddressForDisplay(address: SavedAddress | null): string {
  if (!address) return 'No address selected';
  
  const parts = [
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country !== 'US' ? address.country : ''
  ].filter(Boolean);
  
  return parts.join(', ');
}

// Load Google Maps API
export function loadGoogleMapsAPI(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve(true);
      return;
    }

    // Check if the API key is available
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not found");
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log("Google Maps API loaded successfully");
      resolve(true);
    };

    script.onerror = () => {
      console.error("Failed to load Google Maps API");
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

// Create a handler for address selection
export function createAddressSelectHandler(setter: (address: SavedAddress | null) => void) {
  return (address: SavedAddress | null) => {
    setter(address);
    if (address) {
      console.log("Address selected:", address);
    }
  };
}

// Initialize Google Maps Autocomplete on an input element
export function initAddressAutocomplete(
  inputElement: HTMLInputElement, 
  onPlaceSelected: (place: GoogleMapsPlace) => void
): void {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error("Google Maps API not loaded. Can't initialize autocomplete.");
    return;
  }

  try {
    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address'],
    });

    // Add listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (place && place.address_components) {
        console.log("Google place selected:", place);
        onPlaceSelected(place);
      } else {
        console.warn("Selected place has no address components");
      }
    });

    // Prevent form submission when selecting from dropdown
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement === inputElement) {
        e.preventDefault();
      }
    });

    console.log("Google Maps autocomplete initialized successfully");
  } catch (error) {
    console.error("Error initializing Google Maps autocomplete:", error);
  }
}

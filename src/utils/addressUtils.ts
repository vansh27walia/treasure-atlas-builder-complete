
// Extract address components from Google Place result
import { toast } from "@/components/ui/sonner";

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
  
  // Check if we have address_components
  if (!place.address_components || place.address_components.length === 0) {
    console.warn('No address components found in Google place object');
    
    // Try to parse from formatted_address as a fallback
    if (place.formatted_address) {
      try {
        const parts = place.formatted_address.split(',');
        if (parts.length >= 3) {
          // Typical format: "123 Main St, City, State ZIP"
          street_number = parts[0].trim();
          city = parts[1].trim();
          // Last part typically contains state and zip
          const stateZip = parts[2].trim().split(' ');
          if (stateZip.length >= 2) {
            state = stateZip[0].trim();
            zip = stateZip[stateZip.length - 1].trim();
          }
        }
      } catch (error) {
        console.error('Error parsing formatted address:', error);
        toast.error('Could not parse address components');
      }
    }
  } else {
    try {
      // Extract each component
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
    } catch (error) {
      console.error('Error extracting address components:', error);
    }
  }
  
  // Combine street number and route for street address
  let street1 = '';
  if (street_number && route) {
    street1 = `${street_number} ${route}`;
  } else if (route) {
    street1 = route;
  } else if (street_number) {
    street1 = street_number;
  } else if (place.formatted_address) {
    // If we couldn't extract street components but have a formatted address, use the first part
    try {
      const parts = place.formatted_address.split(',');
      if (parts.length > 0) {
        street1 = parts[0].trim();
      }
    } catch (error) {
      console.error('Error parsing street from formatted address:', error);
    }
  }
  
  console.log('Extracted address components:', { street1, city, state, zip, country });
  
  return {
    street1,
    city,
    state,
    zip,
    country
  };
}

// Format address for display as a string
export function formatAddressForDisplay(address: {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}): string {
  const parts = [
    address.street1,
    address.street2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country && address.country !== 'US' ? address.country : '',
  ].filter(Boolean);
  
  return parts.join(', ');
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

// Load Google Maps API
export async function loadGoogleMapsAPI(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      console.log('✓ Google Maps API already loaded');
      resolve(true);
      return;
    }

    // Remove any existing failed scripts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    if (existingScripts.length > 0) {
      console.log('→ Removing existing Google Maps scripts...');
      existingScripts.forEach(script => script.remove());
    }

    // Get API key from localStorage (set by edge function)
    const apiKey = localStorage.getItem('googleMapsApiKey');
    
    if (!apiKey) {
      console.error('✗ No Google Maps API key found');
      toast.error('Google Maps API key not configured. Manual entry will work.');
      resolve(false);
      return;
    }

    console.log('→ Loading Google Maps API...');

    // Create callback function
    const callbackName = 'initGoogleMapsCallback';
    (window as any)[callbackName] = () => {
      console.log('✓ Google Maps API loaded successfully');
      delete (window as any)[callbackName];
      resolve(true);
    };

    // Create and append script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      console.error('✗ Error loading Google Maps API:', error);
      console.error('→ This usually means the API key is invalid or has restrictions');
      delete (window as any)[callbackName];
      localStorage.removeItem('googleMapsApiKey'); // Clear bad key
      toast.error('Google Maps API failed to load. Check API key configuration.');
      resolve(false);
    };

    document.head.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!window.google?.maps?.places) {
        console.error('✗ Google Maps API timed out after 10 seconds');
        resolve(false);
      }
    }, 10000);
  });
}

// Initialize address autocomplete on an input element
export function initAddressAutocomplete(
  inputElement: HTMLInputElement,
  onPlaceSelected: (place: GoogleMapsPlace) => void
): void {
  console.log('Initializing address autocomplete for input:', inputElement);
  
  try {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps API not loaded');
      return;
    }
    
    const options = {
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      types: ['address'],
      componentRestrictions: { country: ['us'] } // Restrict to US addresses for better results
    };
    
    const autocomplete = new window.google.maps.places.Autocomplete(inputElement, options);
    
    // Add listener for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      console.log('Google place selected in autocomplete:', place);
      
      if (place && (place.address_components || place.formatted_address)) {
        console.log('Valid place selected, calling onPlaceSelected');
        onPlaceSelected(place);
      } else {
        console.warn('Invalid place selected:', place);
        toast.warning('Please select a valid address from the dropdown');
      }
    });
    
    // Prevent form submission when selecting with Enter key
    inputElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement === inputElement) {
        e.preventDefault();
      }
    });
    
    // Fix z-index of autocomplete dropdown - increase to ensure it's on top
    setTimeout(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach((container) => {
        (container as HTMLElement).style.zIndex = '9999';
        (container as HTMLElement).style.backgroundColor = 'white';
      });
    }, 300);
    
    console.log('Address autocomplete initialized successfully');
  } catch (error) {
    console.error('Error initializing address autocomplete:', error);
  }
}

// Handler creator for address selection in forms
export function createAddressSelectHandler(formSetter: (addressData: any) => void) {
  return (address: any) => {
    if (!address) return;
    
    console.log('Address selected:', address);
    
    // Map the address to the form fields
    const mappedAddress = {
      name: address.name || '',
      company: address.company || '',
      street1: address.street1 || '',
      street2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'US',
      phone: address.phone || '',
    };
    
    // Call the form setter with the mapped address
    formSetter(mappedAddress);
  };
}

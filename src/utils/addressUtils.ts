
import { SavedAddress } from '@/services/AddressService';
import { SimpleAddress } from '@/components/shipping/AddressSelector';
import { supabase } from "@/integrations/supabase/client";

// Add a type declaration for the Google Maps API
declare global {
  interface Window {
    google?: {
      maps: any;
    };
  }
}

/**
 * Creates a temporary SavedAddress object from a SimpleAddress form input
 * This allows components to work with SimpleAddress inputs while maintaining
 * compatibility with SavedAddress type requirements
 */
export function createTempSavedAddress(simpleAddress: SimpleAddress): SavedAddress {
  return {
    // Generate a temporary negative ID that won't conflict with DB IDs
    id: Math.floor(Math.random() * -1000) - 1,
    user_id: 'temp',
    is_default_from: false,
    is_default_to: false,
    // Ensure all required fields have default values if they're undefined
    name: simpleAddress.name || 'Unnamed',  // Default name for SavedAddress
    company: simpleAddress.company,
    street1: simpleAddress.street1 || '',   // Default empty string if undefined
    street2: simpleAddress.street2,
    city: simpleAddress.city || '',         // Default empty string if undefined
    state: simpleAddress.state || '',       // Default empty string if undefined
    zip: simpleAddress.zip || '',           // Default empty string if undefined
    country: simpleAddress.country || 'US', // Default to US if undefined
    phone: simpleAddress.phone,
  };
}

/**
 * Adapter function to convert from useState dispatcher to AddressSelector compatible function
 */
export function createAddressSelectHandler(
  setter: React.Dispatch<React.SetStateAction<SavedAddress | null>>
): (address: SimpleAddress) => void {
  return (simpleAddress: SimpleAddress) => {
    const tempSavedAddress = createTempSavedAddress(simpleAddress);
    setter(tempSavedAddress);
  };
}

/**
 * Loads the Google Maps JavaScript API with Places library
 * This function will fetch the API key from our secure Edge Function
 */
export const loadGoogleMapsAPI = async (): Promise<boolean> => {
  try {
    // If Google API is already loaded, don't load it again
    if (window.google && window.google.maps) {
      return true;
    }
    
    // Fetch API key from secure Edge Function
    const { data, error } = await supabase.functions.invoke('get-google-api-key');
    
    if (error || !data?.available || !data?.apiKey) {
      console.error('Failed to load Google API key:', error || 'API key not available');
      return false;
    }
    
    return new Promise((resolve) => {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      // On load callback
      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve(true);
      };
      
      // On error callback
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        resolve(false);
      };
      
      // Append script to document
      document.head.appendChild(script);
    });
  } catch (error) {
    console.error('Error loading Google Maps API:', error);
    return false;
  }
};

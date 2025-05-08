
import { SavedAddress } from '@/services/AddressService';
import { SimpleAddress } from '@/components/shipping/AddressSelector';

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

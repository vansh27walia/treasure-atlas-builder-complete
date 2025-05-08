
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
    ...simpleAddress,
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

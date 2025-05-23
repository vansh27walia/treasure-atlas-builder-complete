
import { SavedAddress } from '@/services/AddressService';
import { extractAddressComponents } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';

/**
 * Utility function to process Google Maps place selection
 */
export const processGooglePlaceSelection = (place: GoogleMapsPlace): Partial<SavedAddress> => {
  try {
    const addressComponents = extractAddressComponents(place);
    console.log("Processing Google Place selection:", addressComponents);
    
    // Make sure we have at least the minimum required fields
    if (!addressComponents.street1) {
      toast.error('Could not extract street address from selection');
      return {};
    }
    
    if (!addressComponents.city || !addressComponents.state || !addressComponents.zip) {
      toast.warning('Some address details could not be extracted. Please fill them in manually.');
    }
    
    return {
      street1: addressComponents.street1,
      city: addressComponents.city,
      state: addressComponents.state,
      zip: addressComponents.zip,
      country: addressComponents.country
    };
  } catch (error) {
    console.error('Error processing Google place selection:', error);
    toast.error('Failed to process selected address');
    return {};
  }
};

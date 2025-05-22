
import React from 'react';
import { toast } from '@/components/ui/sonner';
import { extractAddressComponents } from '@/utils/addressUtils';
import { useForm } from 'react-hook-form';
import type { SavedAddress } from '@/utils/addressUtils';

interface AddressSelectionProps {
  form?: any; // The form instance from useForm
  onAddressSelect?: (address: any) => void;
}

// Exporting named component instead of default
export const AddressSelector: React.FC<AddressSelectionProps> = ({
  form,
  onAddressSelect
}) => {
  // Just updating the handleGooglePlaceSelected function to be more robust
  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    if (place && place.address_components) {
      try {
        const addressComponents = extractAddressComponents(place);
        
        // Update form values with extracted address components
        if (addressComponents.street1 && form) form.setValue('street1', addressComponents.street1, { shouldValidate: true });
        if (addressComponents.city && form) form.setValue('city', addressComponents.city, { shouldValidate: true });
        if (addressComponents.state && form) form.setValue('state', addressComponents.state, { shouldValidate: true });
        if (addressComponents.zip && form) form.setValue('zip', addressComponents.zip, { shouldValidate: true });
        if (addressComponents.country && form) form.setValue('country', addressComponents.country, { shouldValidate: true });
        
        // Trigger form validation
        if (form) form.trigger(['street1', 'city', 'state', 'zip', 'country']);
        
        toast.success('Address found and auto-filled');
        
        // Submit form values if all required fields are populated
        if (addressComponents.street1 && addressComponents.city && 
            addressComponents.state && addressComponents.zip) {
          if (onAddressSelect) {
            const values = form ? form.getValues() : addressComponents;
            onAddressSelect(values);
          }
        }
      } catch (error) {
        console.error('Error processing Google place selection:', error);
        toast.error('Failed to process selected address. Please try entering it manually.');
      }
    }
  };

  // Rest of component implementation
  return <div>Address selector component</div>;
};

// Also export as default for backward compatibility
export default AddressSelector;

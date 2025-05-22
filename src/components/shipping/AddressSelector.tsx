
import React from 'react';
import { toast } from '@/components/ui/sonner';
import type { SavedAddress } from '@/utils/addressUtils';

interface AddressSelectionProps {
  form?: any; // The form instance from useForm
  onAddressSelect?: (address: any) => void;
  type?: string; // Added type prop for "from" or "to" address
  selectedAddressId?: string | number; // Added for selected address tracking
  useGoogleAutocomplete?: boolean; // Flag to indicate if Google autocomplete should be used
}

// Exporting named component instead of default
export const AddressSelector: React.FC<AddressSelectionProps> = ({
  form,
  onAddressSelect,
  type, // New type prop
  selectedAddressId,
  useGoogleAutocomplete = false // Default to false
}) => {
  // Handle manual address input
  const handleAddressInput = (addressData: Partial<SavedAddress>) => {
    try {
      // Update form values with entered address components
      if (addressData.street1 && form) form.setValue('street1', addressData.street1, { shouldValidate: true });
      if (addressData.city && form) form.setValue('city', addressData.city, { shouldValidate: true });
      if (addressData.state && form) form.setValue('state', addressData.state, { shouldValidate: true });
      if (addressData.zip && form) form.setValue('zip', addressData.zip, { shouldValidate: true });
      if (addressData.country && form) form.setValue('country', addressData.country, { shouldValidate: true });
      
      // Trigger form validation
      if (form) form.trigger(['street1', 'city', 'state', 'zip', 'country']);
      
      // Submit form values if all required fields are populated
      if (addressData.street1 && addressData.city && 
          addressData.state && addressData.zip) {
        if (onAddressSelect) {
          const values = form ? form.getValues() : addressData;
          onAddressSelect(values);
        }
      }
    } catch (error) {
      console.error('Error processing address input:', error);
      toast.error('Failed to process address. Please try again.');
    }
  };

  // Rest of component implementation
  return <div>Address selector component {type ? `(${type})` : ''}</div>;
};

// Also export as default for backward compatibility
export default AddressSelector;

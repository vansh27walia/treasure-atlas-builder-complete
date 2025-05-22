
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { SavedAddress } from '@/services/AddressService';
import { extractAddressComponents } from '@/utils/addressUtils';
import AddressAutoComplete from './AddressAutoComplete';

export interface AddressSelectionProps {
  onAddressSelect: (address: SavedAddress | null) => void;
  useGoogleAutocomplete?: boolean;
  selectedAddressId?: number;
  type?: string;
}

const AddressSelector = ({ 
  onAddressSelect, 
  useGoogleAutocomplete = false,
  selectedAddressId,
  type = 'shipping'
}: AddressSelectionProps) => {
  
  const form = useForm();

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    if (place && place.address_components) {
      try {
        const addressComponents = extractAddressComponents(place);
        
        // Update form values with extracted address components
        if (addressComponents.street1) form.setValue('street1', addressComponents.street1, { shouldValidate: true });
        if (addressComponents.city) form.setValue('city', addressComponents.city, { shouldValidate: true });
        if (addressComponents.state) form.setValue('state', addressComponents.state, { shouldValidate: true });
        if (addressComponents.zip) form.setValue('zip', addressComponents.zip, { shouldValidate: true });
        if (addressComponents.country) form.setValue('country', addressComponents.country, { shouldValidate: true });
        
        // Trigger form validation
        form.trigger(['street1', 'city', 'state', 'zip', 'country']);
        
        toast.success('Address found and auto-filled');
        
        // Submit form values if all required fields are populated
        if (addressComponents.street1 && addressComponents.city && 
            addressComponents.state && addressComponents.zip) {
          if (onAddressSelect) {
            const values = form.getValues();
            onAddressSelect(values as unknown as SavedAddress);
          }
        }
      } catch (error) {
        console.error('Error processing Google place selection:', error);
        toast.error('Failed to process selected address. Please try entering it manually.');
      }
    }
  };

  // Placeholder for the component's UI - this will be implemented as needed
  return (
    <div>
      {useGoogleAutocomplete && (
        <AddressAutoComplete 
          onAddressSelected={handleGooglePlaceSelected}
          placeholder={`Enter ${type || 'shipping'} address`}
        />
      )}
      
      {/* Placeholder for address selection UI */}
      <div className="mt-3">
        {/* Address selection interface would go here */}
      </div>
    </div>
  );
};

export default AddressSelector;

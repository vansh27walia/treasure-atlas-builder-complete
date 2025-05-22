
import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI, initAddressAutocomplete } from '@/utils/addressUtils';

interface AddressAutoCompleteProps {
  onAddressSelected: (place: GoogleMapsPlace) => void;
  placeholder?: string;
  defaultValue?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

const AddressAutoComplete: React.FC<AddressAutoCompleteProps> = ({
  onAddressSelected,
  placeholder = 'Enter address',
  defaultValue = '',
  id,
  name,
  required = false,
  className = '',
  disabled = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    let autocomplete: GoogleMapsAutocomplete | null = null;
    
    const initAutocomplete = async () => {
      if (!inputRef.current) return;
      
      try {
        const googleMapsLoaded = await loadGoogleMapsAPI();
        
        if (googleMapsLoaded && inputRef.current) {
          // Initialize autocomplete on the input element
          autocomplete = initAddressAutocomplete(
            inputRef.current, 
            (place: GoogleMapsPlace) => {
              onAddressSelected(place);
            }
          );
        }
      } catch (error) {
        console.error("Error initializing Google Maps autocomplete:", error);
      }
    };
    
    initAutocomplete();
    
    return () => {
      // No cleanup needed for Google Maps autocomplete
    };
  }, [onAddressSelected]);

  return (
    <Input
      ref={inputRef}
      type="text"
      id={id}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      className={className}
      disabled={disabled}
    />
  );
};

export default AddressAutoComplete;

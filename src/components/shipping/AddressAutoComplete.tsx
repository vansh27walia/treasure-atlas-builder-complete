
import React, { useEffect, useRef, useState } from 'react';
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
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    let autocomplete: GoogleMapsAutocomplete | null = null;
    
    const initAutocomplete = async () => {
      if (!inputRef.current) return;
      
      try {
        const googleMapsLoaded = await loadGoogleMapsAPI();
        
        if (googleMapsLoaded && inputRef.current) {
          setIsLoaded(true);
          
          // Initialize autocomplete on the input element with a slight delay
          // to ensure the DOM is fully rendered
          setTimeout(() => {
            if (inputRef.current) {
              autocomplete = initAddressAutocomplete(
                inputRef.current, 
                (place: GoogleMapsPlace) => {
                  onAddressSelected(place);
                }
              );
            }
          }, 100);
        }
      } catch (error) {
        console.error("Error initializing Google Maps autocomplete:", error);
      }
    };
    
    initAutocomplete();
    
    // Clean up function
    return () => {
      // Google Maps autocomplete doesn't need explicit cleanup
    };
  }, [onAddressSelected]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        placeholder={isLoaded ? `${placeholder} (start typing for suggestions)` : placeholder}
        defaultValue={defaultValue}
        required={required}
        className={`${className} ${isLoaded ? 'border-blue-300 focus:border-blue-500' : ''}`}
        disabled={disabled}
        autoComplete="off" // Disable browser's native autocomplete
      />
      {isLoaded && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500">
          Maps
        </div>
      )}
    </div>
  );
};

export default AddressAutoComplete;


import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI, extractAddressComponents } from '@/utils/addressUtils';

interface AddressAutoCompleteProps {
  onAddressSelected: (place: GoogleMapsPlace) => void;
  placeholder?: string;
  defaultValue?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const AddressAutoComplete: React.FC<AddressAutoCompleteProps> = ({
  onAddressSelected,
  placeholder = 'Enter address',
  defaultValue = '',
  id,
  name,
  required = false,
  className = '',
  disabled = false,
  onChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [value, setValue] = useState(defaultValue);
  
  // Update internal state when defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
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
              // Create the autocomplete instance
              const options = {
                fields: ['address_components', 'formatted_address', 'geometry', 'name'],
                types: ['address'],
              };
              
              if (window.google && window.google.maps && window.google.maps.places) {
                autocompleteRef.current = new window.google.maps.places.Autocomplete(
                  inputRef.current,
                  options
                );
                
                // Add listener for place selection
                autocompleteRef.current.addListener('place_changed', () => {
                  if (!autocompleteRef.current) return;
                  
                  const place = autocompleteRef.current.getPlace();
                  console.log("Google Maps place selected:", place);
                  
                  if (place && place.formatted_address) {
                    setValue(place.formatted_address);
                    if (onChange) onChange(place.formatted_address);
                  }
                  
                  if (place && place.address_components) {
                    onAddressSelected(place);
                  }
                });
                
                // Prevent form submission when selecting an address
                if (inputRef.current) {
                  inputRef.current.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && document.activeElement === inputRef.current) {
                      e.preventDefault();
                    }
                  });
                }
              }
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
      // Clean up event listeners
      if (autocompleteRef.current && window.google && window.google.maps) {
        // We don't use window.google.maps.event (which doesn't exist in our type definition)
        // Instead, use the addListener method of autocomplete instance directly
        if (inputRef.current) {
          inputRef.current.removeEventListener('keydown', () => {});
        }
      }
    };
  }, [onAddressSelected, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        placeholder={isLoaded ? `${placeholder} (start typing for suggestions)` : placeholder}
        value={value}
        onChange={handleInputChange}
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

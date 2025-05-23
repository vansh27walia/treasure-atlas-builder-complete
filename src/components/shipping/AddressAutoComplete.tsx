
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI, initAddressAutocomplete } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [apiError, setApiError] = useState(false);
  
  // Update internal state when defaultValue changes
  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    let isMounted = true;
    
    const initAutocomplete = async () => {
      if (!inputRef.current) return;
      
      try {
        console.log("Initializing Google Maps Autocomplete...");
        const googleMapsLoaded = await loadGoogleMapsAPI();
        
        if (googleMapsLoaded && inputRef.current && isMounted) {
          console.log("Google Maps API loaded successfully");
          setIsLoaded(true);
          
          // Initialize autocomplete on the input element
          initAddressAutocomplete(inputRef.current, (place) => {
            console.log("Google Maps place selected:", place);
            
            if (place && place.formatted_address) {
              console.log("Setting formatted address:", place.formatted_address);
              setValue(place.formatted_address);
              if (onChange) onChange(place.formatted_address);
            }
            
            if (place) {
              // Pass the complete place object to the parent component
              console.log("Calling onAddressSelected with place");
              onAddressSelected(place);
            } else {
              console.warn("Missing place data in selection");
            }
          });
        } else if (!googleMapsLoaded && isMounted) {
          console.warn("Google Maps API failed to load");
          // Silent fail - just don't show the indicator
          setApiError(false); // We don't want to show the error since we're making it internal
        }
      } catch (error) {
        console.error("Error initializing Google Maps autocomplete:", error);
        if (isMounted) {
          // Silent fail - don't make this an error
          setApiError(false);
        }
      }
    };
    
    initAutocomplete();
    
    // Clean up function
    return () => {
      isMounted = false;
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
        style={{ zIndex: 10 }} // Ensure input is above other elements
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

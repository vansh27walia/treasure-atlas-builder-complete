
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI } from '@/utils/addressUtils';
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
        console.log("Initializing Google Maps Autocomplete...");
        const googleMapsLoaded = await loadGoogleMapsAPI();
        
        if (googleMapsLoaded && inputRef.current) {
          console.log("Google Maps API loaded successfully");
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
                console.log("Creating Google Maps Autocomplete instance");
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
                    toast.warning("Could not get complete address details");
                  }
                });
                
                // Prevent form submission when selecting an address with Enter key
                inputRef.current.addEventListener('keydown', (e) => {
                  if (e.key === 'Enter' && document.activeElement === inputRef.current) {
                    e.preventDefault();
                  }
                });
                
                // Fix z-index of Google autocomplete dropdown (ensure it's above other elements)
                fixAutocompleteStyles();
              } else {
                console.error("Google Maps Places API not available");
                toast.error("Google Maps address search is not available");
              }
            }
          }, 100);
        } else {
          console.warn("Google Maps API failed to load");
          toast.error("Failed to load address search. Please enter address manually.");
        }
      } catch (error) {
        console.error("Error initializing Google Maps autocomplete:", error);
        toast.error("Error setting up address search");
      }
    };
    
    initAutocomplete();
    
    // Clean up function
    return () => {
      // Remove Google Maps autocomplete event listeners
      if (autocompleteRef.current && window.google && window.google.maps && window.google.maps.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelected, onChange]);

  // Function to fix z-index and style issues with Google's autocomplete dropdown
  const fixAutocompleteStyles = () => {
    // Fix z-index of Google autocomplete dropdown
    const fixStyles = () => {
      const containers = document.querySelectorAll('.pac-container');
      containers.forEach((container) => {
        const element = container as HTMLElement;
        element.style.zIndex = '9999';
        element.style.position = 'absolute';
        element.style.width = inputRef.current?.offsetWidth + 'px';
        element.style.marginTop = '2px';
        element.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        element.style.backgroundColor = 'white';
        element.style.border = '1px solid rgba(209, 213, 219, 1)';
        element.style.borderRadius = '0.375rem';
      });
    };
    
    // Call immediately and set up an observer
    setTimeout(fixStyles, 300);
    
    // Also set up a mutation observer to catch dynamic additions
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          setTimeout(fixStyles, 10);
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Return cleanup function
    return () => observer.disconnect();
  };

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

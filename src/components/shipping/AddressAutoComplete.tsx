
import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { loadGoogleMapsAPI, initAddressAutocomplete } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [apiKeyFetched, setApiKeyFetched] = useState(false);
  const autocompleteInitialized = useRef(false);
  
  // Update internal state when defaultValue changes
  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  // Optimize API key fetching to prevent multiple calls
  useEffect(() => {
    let isMounted = true;
    
    const fetchApiKey = async () => {
      try {
        // Check for cached key first
        const cachedApiKey = localStorage.getItem('googleMapsApiKey');
        
        if (cachedApiKey) {
          console.log("Using cached Google Maps API key");
          return cachedApiKey;
        }
        
        setIsLoadingKey(true);
        // First try to get the API key from the Supabase edge function
        const { data, error } = await supabase.functions.invoke('get-google-api-key');
        
        if (error) {
          console.error("Error fetching API key from edge function:", error);
          setIsLoadingKey(false);
          return null;
        }
        
        if (data && data.apiKey) {
          console.log("Retrieved Google Maps API key from edge function");
          // Store it for future use
          localStorage.setItem('googleMapsApiKey', data.apiKey);
          return data.apiKey;
        }
      } catch (error) {
        console.error("Failed to fetch API key from edge function:", error);
      }
      
      setIsLoadingKey(false);
      return null;
    };
    
    const initAutocomplete = async () => {
      if (!inputRef.current || autocompleteInitialized.current) return;
      
      try {
        console.log("Initializing Google Maps Autocomplete...");
        setIsLoadingKey(true);
        
        // Try to get API key
        const apiKey = await fetchApiKey();
        setApiKeyFetched(true);
        
        if (apiKey) {
          console.log("Found Google Maps API key, initializing...");
          
          // This will use the API key we just stored
          const googleMapsLoaded = await loadGoogleMapsAPI();
          
          if (googleMapsLoaded && inputRef.current && isMounted) {
            console.log("Google Maps API loaded successfully");
            setIsLoaded(true);
            setIsLoadingKey(false);
            autocompleteInitialized.current = true;
            
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
                toast.warning("Could not get complete address details");
              }
            });
          } else {
            console.warn("Google Maps API failed to load");
            if (isMounted) {
              setApiError(true);
              setIsLoadingKey(false);
            }
          }
        } else {
          console.warn("No Google Maps API key found");
          if (isMounted) {
            setApiError(true);
            setIsLoadingKey(false);
            toast.error("Google Maps API key not found. Please add one in settings.");
          }
        }
      } catch (error) {
        console.error("Error initializing Google Maps autocomplete:", error);
        if (isMounted) {
          setApiError(true);
          setIsLoadingKey(false);
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
        disabled={disabled || isLoadingKey}
        autoComplete="off" // Disable browser's native autocomplete
        style={{ zIndex: 10 }} // Ensure input is above other elements
      />
      {isLoaded && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-500">
          Maps
        </div>
      )}
      {isLoadingKey && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
          Loading...
        </div>
      )}
      {apiError && (
        <div className="text-xs text-amber-600 mt-1">
          Address autocomplete is unavailable - manual entry works fine
        </div>
      )}
    </div>
  );
};

export default AddressAutoComplete;

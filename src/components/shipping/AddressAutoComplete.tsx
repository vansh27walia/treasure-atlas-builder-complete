import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  onFullAddressPopulated?: (addressData: any) => void;
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
  onChange,
  onFullAddressPopulated
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [apiError, setApiError] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const autocompleteInitialized = useRef(false);
  
  // Update internal state when defaultValue changes
  useEffect(() => {
    if (defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  // Enhanced address selection handler that populates the entire form
  const handleAddressSelection = useCallback((place: GoogleMapsPlace) => {
    console.log("Google Maps place selected:", place);
    
    if (place && place.formatted_address) {
      console.log("Setting formatted address:", place.formatted_address);
      setValue(place.formatted_address);
      if (onChange) onChange(place.formatted_address);
    }
    
    if (place) {
      console.log("Calling onAddressSelected with place");
      onAddressSelected(place);
      
      // Extract and populate full address data
      if (onFullAddressPopulated) {
        const addressData = extractFullAddressData(place);
        console.log("Extracted full address data:", addressData);
        onFullAddressPopulated(addressData);
      }
    } else {
      console.warn("Missing place data in selection");
      toast.warning("Could not get complete address details");
    }
  }, [onAddressSelected, onChange, onFullAddressPopulated]);

  // Function to extract complete address data from Google Place
  const extractFullAddressData = (place: GoogleMapsPlace) => {
    let street_number = '';
    let route = '';
    let city = '';
    let state = '';
    let zip = '';
    let country = 'US';
    
    if (place.address_components && place.address_components.length > 0) {
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          street_number = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('locality') || types.includes('sublocality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (types.includes('postal_code')) {
          zip = component.long_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        }
      });
    }
    
    // Combine street number and route for full street address
    const street1 = street_number && route ? `${street_number} ${route}` : (route || street_number || '');
    
    return {
      street1,
      city,
      state,
      zip,
      country,
      formatted_address: place.formatted_address || ''
    };
  };

  // Optimize API key fetching to prevent multiple calls
  useEffect(() => {
    let isMounted = true;
    
    const fetchApiKey = async () => {
      try {
        // Always clear cached key and fetch fresh one
        localStorage.removeItem('googleMapsApiKey');
        
        setIsLoadingKey(true);
        console.log("Fetching Google Maps API key from Supabase...");
        
        // Get the API key from the Supabase edge function
        const { data, error } = await supabase.functions.invoke('get-google-api-key');
        
        if (error) {
          console.error("Error fetching API key from edge function:", error);
          setIsLoadingKey(false);
          toast.error("Failed to load Google Maps API key. Manual entry will work.");
          return null;
        }
        
        if (data && data.apiKey) {
          console.log("✓ Retrieved Google Maps API key successfully");
          // Store it for this session
          localStorage.setItem('googleMapsApiKey', data.apiKey);
          return data.apiKey;
        } else {
          console.error("No API key returned from edge function");
          toast.error("Google Maps API key not configured. Manual entry will work.");
        }
      } catch (error) {
        console.error("Failed to fetch API key:", error);
        toast.error("Error loading Google Maps. Manual entry will work.");
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
        
        if (apiKey) {
          console.log("Found Google Maps API key, initializing...");
          
          // This will use the API key we just stored
          const googleMapsLoaded = await loadGoogleMapsAPI();
          
          if (googleMapsLoaded && inputRef.current && isMounted) {
            console.log("Google Maps API loaded successfully");
            setIsLoaded(true);
            setIsLoadingKey(false);
            autocompleteInitialized.current = true;
            
            // Initialize autocomplete on the input element with proper callback
            initAddressAutocomplete(inputRef.current, handleAddressSelection);
            
            toast.success("Google Maps address search is ready");
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
    
    // Only initialize if not already done
    if (!autocompleteInitialized.current) {
      initAutocomplete();
    }
    
    // Clean up function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once

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
        autoComplete="off"
        style={{ zIndex: 10 }}
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

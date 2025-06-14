
import { useState, useEffect, useCallback } from 'react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { extractAddressComponents } from '@/utils/addressUtils';

export const usePickupAddresses = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [addressCount, setAddressCount] = useState(0);
  const ADDRESS_LIMIT = 50; // Maximum number of addresses per user

  // Load all addresses - optimized with useCallback
  const loadAddresses = useCallback(async (autoSelectDefault: boolean = true) => {
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      console.log("Loaded addresses:", savedAddresses);
      
      if (savedAddresses) {
        setAddresses(savedAddresses);
        setAddressCount(savedAddresses.length);
        
        // Select default from address if requested
        if (autoSelectDefault && savedAddresses.length > 0) {
          const defaultAddress = savedAddresses.find(addr => addr.is_default_from);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
            console.log("Selected pickup address:", defaultAddress);
            return defaultAddress;
          }
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  // Load addresses on hook initialization
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Create new address with retry mechanism
  const createAddress = async (addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">) => {
    setIsUpdating(true);
    try {
      console.log("Creating address with data:", addressData);
      
      // Check address limit
      if (addressCount >= ADDRESS_LIMIT) {
        toast.error(`You can only save up to ${ADDRESS_LIMIT} addresses`);
        return null;
      }
      
      // Validate required fields to ensure they're not empty
      if (!addressData.street1) throw new Error('Address line 1 is required');
      if (!addressData.city) throw new Error('City is required');
      if (!addressData.state) throw new Error('State is required');
      if (!addressData.zip) throw new Error('ZIP code is required');
      
      // Check for authenticated user before proceeding
      const { data } = await addressService.getSession();
      if (!data?.session?.user) {
        throw new Error('You need to be logged in to save addresses');
      }
      
      // Ensure phone field is never undefined
      const finalAddressData = {
        ...addressData,
        phone: addressData.phone || ''
      };
      
      // Try the encryption method first (uses edge function that handles user creation)
      try {
        console.log("Trying to create address with encryption method first");
        const newAddress = await addressService.createAddress(finalAddressData, true);
        console.log("Created address with encryption method:", newAddress);
        
        if (newAddress) {
          // If address should be default from, update it
          if (finalAddressData.is_default_from) {
            await addressService.setDefaultFromAddress(newAddress.id);
          }
          
          // Update local state
          await loadAddresses(true); // Reload addresses to ensure we have the latest data
          
          toast.success('Address saved successfully');
          return newAddress;
        }
      } catch (encryptionError) {
        console.error("Encryption method failed, trying standard method", encryptionError);
        
        // If encryption fails, try standard creation
        try {
          const newAddress = await addressService.createAddress(finalAddressData, false);
          console.log("Created address with standard method:", newAddress);
          
          if (newAddress) {
            // If address should be default from, update it
            if (finalAddressData.is_default_from) {
              await addressService.setDefaultFromAddress(newAddress.id);
            }
            
            // Update local state
            await loadAddresses(true); // Reload addresses to ensure we have the latest data
            
            toast.success('Address saved successfully');
            return newAddress;
          }
        } catch (standardError) {
          console.error("Both address creation methods failed", standardError);
          throw new Error('Failed to create address. Please try again.');
        }
      }
      
      throw new Error('Failed to create address - no result returned');
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save address');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Update existing address with improved error handling
  const updateAddress = async (addressId: number, addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">) => {
    setIsUpdating(true);
    try {
      console.log("Updating address with ID:", addressId, "and data:", addressData);
      
      // Validate required fields
      if (!addressData.street1) throw new Error('Address line 1 is required');
      if (!addressData.city) throw new Error('City is required');
      if (!addressData.state) throw new Error('State is required');
      if (!addressData.zip) throw new Error('ZIP code is required');
      
      // Ensure phone field is never undefined
      const finalAddressData = {
        ...addressData,
        phone: addressData.phone || ''
      };
      
      // Try first with encryption
      try {
        console.log("Trying to update with encryption method first");
        const updatedAddress = await addressService.updateAddress(addressId, finalAddressData, true);
        console.log("Address updated with encryption method:", updatedAddress);
        
        if (updatedAddress) {
          // If address should be default from, update it
          if (finalAddressData.is_default_from) {
            await addressService.setDefaultFromAddress(updatedAddress.id);
          }
          
          // Update local state
          setAddresses(prev => prev.map(addr => 
            addr.id === addressId ? updatedAddress! : addr
          ));
          
          // Update selected address if needed
          if (selectedAddress?.id === addressId) {
            setSelectedAddress(updatedAddress);
          }
          
          toast.success('Address updated successfully');
          return updatedAddress;
        }
      } catch (encryptionError) {
        console.log("Encryption update failed, trying standard method", encryptionError);
        
        // If that fails, try without encryption
        try {
          const updatedAddress = await addressService.updateAddress(addressId, finalAddressData, false);
          console.log("Address updated with standard method:", updatedAddress);
          
          if (updatedAddress) {
            // If address should be default from, update it
            if (finalAddressData.is_default_from) {
              await addressService.setDefaultFromAddress(updatedAddress.id);
            }
            
            // Update local state
            setAddresses(prev => prev.map(addr => 
              addr.id === addressId ? updatedAddress! : addr
            ));
            
            // Update selected address if needed
            if (selectedAddress?.id === addressId) {
              setSelectedAddress(updatedAddress);
            }
            
            toast.success('Address updated successfully');
            return updatedAddress;
          }
        } catch (standardError) {
          console.error("Both address update methods failed", standardError);
          throw new Error('Failed to update address. Please try again.');
        }
      }
      
      throw new Error('Failed to update address');
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update address');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Delete address with improved error handling
  const deleteAddress = async (addressId: number) => {
    setIsUpdating(true);
    try {
      const success = await addressService.deleteAddress(addressId);
      
      if (!success) {
        throw new Error('Failed to delete address');
      }
      
      // Update local state
      setAddresses(prev => prev.filter(addr => addr.id !== addressId));
      setAddressCount(prev => prev - 1);
      
      // If selected address was deleted, clear selection
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(null);
      }
      
      toast.success('Address deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Set address as default from
  const setAsDefaultFrom = async (addressId: number) => {
    setIsUpdating(true);
    try {
      const success = await addressService.setDefaultFromAddress(addressId);
      
      if (!success) {
        throw new Error('Failed to set default address');
      }
      
      // Update local state to reflect new default status
      setAddresses(prev => prev.map(addr => ({
        ...addr,
        is_default_from: addr.id === addressId
      })));
      
      // Update selected address status if needed
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(prev => prev ? { ...prev, is_default_from: true } : null);
      }
      
      toast.success('Default pickup address updated');
      return true;
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Process Google Maps place selection
  const processGooglePlaceSelection = (place: GoogleMapsPlace): Partial<SavedAddress> => {
    try {
      const addressComponents = extractAddressComponents(place);
      console.log("Processing Google Place selection:", addressComponents);
      
      // Make sure we have at least the minimum required fields
      if (!addressComponents.street1) {
        toast.error('Could not extract street address from selection');
        return {};
      }
      
      if (!addressComponents.city || !addressComponents.state || !addressComponents.zip) {
        toast.warning('Some address details could not be extracted. Please fill them in manually.');
      }
      
      return {
        street1: addressComponents.street1,
        city: addressComponents.city,
        state: addressComponents.state,
        zip: addressComponents.zip,
        country: addressComponents.country
      };
    } catch (error) {
      console.error('Error processing Google place selection:', error);
      toast.error('Failed to process selected address');
      return {};
    }
  };

  return {
    addresses,
    selectedAddress,
    isLoading,
    isUpdating,
    addressCount,
    ADDRESS_LIMIT,
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefaultFrom,
    setSelectedAddress,
    processGooglePlaceSelection
  };
};

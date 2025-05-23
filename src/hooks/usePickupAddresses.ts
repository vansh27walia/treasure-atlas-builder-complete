
import { useState, useEffect } from 'react';
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

  // Load all addresses
  const loadAddresses = async (autoSelectDefault: boolean = true) => {
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      console.log("Loaded addresses:", savedAddresses);
      setAddresses(savedAddresses || []);
      setAddressCount(savedAddresses.length);
      
      // Select default from address if requested
      if (autoSelectDefault && savedAddresses.length > 0) {
        const defaultAddress = savedAddresses.find(addr => addr.is_default_from);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
          return defaultAddress;
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // Load addresses on hook initialization
  useEffect(() => {
    loadAddresses();
  }, []);

  // Create new address
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
      
      // Try standard address creation first
      let newAddress: SavedAddress | null = null;
      try {
        newAddress = await addressService.createAddress(addressData, false);
        console.log("Created address with standard method:", newAddress);
      } catch (standardError) {
        console.warn("Standard address creation failed, trying with encryption", standardError);
        // If standard creation fails, try with encryption as fallback
        try {
          newAddress = await addressService.createAddress(addressData, true);
          console.log("Created address with encryption method:", newAddress);
        } catch (encryptionError) {
          console.error("Both address creation methods failed", encryptionError);
          throw new Error('Failed to create address using both methods');
        }
      }
      
      if (!newAddress) {
        throw new Error('Failed to create address - no result returned');
      }
      
      // If address should be default from, update it
      if (addressData.is_default_from) {
        await addressService.setDefaultFromAddress(newAddress.id);
      }
      
      // Update local state
      await loadAddresses(true); // Reload addresses to ensure we have the latest data
      
      toast.success('Address saved successfully');
      return newAddress;
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save address');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  // Update existing address
  const updateAddress = async (addressId: number, addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">) => {
    setIsUpdating(true);
    try {
      console.log("Updating address with ID:", addressId, "and data:", addressData);
      
      // Validate required fields
      if (!addressData.street1) throw new Error('Address line 1 is required');
      if (!addressData.city) throw new Error('City is required');
      if (!addressData.state) throw new Error('State is required');
      if (!addressData.zip) throw new Error('ZIP code is required');
      
      // Try first without encryption
      let updatedAddress: SavedAddress | null = null;
      try {
        updatedAddress = await addressService.updateAddress(addressId, addressData, false);
      } catch (standardError) {
        console.log("Regular address update failed, trying with encryption", standardError);
        // If that fails, try with encryption as a fallback
        updatedAddress = await addressService.updateAddress(addressId, addressData, true);
      }
      
      if (!updatedAddress) {
        throw new Error('Failed to update address');
      }
      
      console.log("Address updated successfully:", updatedAddress);
      
      // If address should be default from, update it
      if (addressData.is_default_from) {
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
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update address');
      return null;
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Delete address
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

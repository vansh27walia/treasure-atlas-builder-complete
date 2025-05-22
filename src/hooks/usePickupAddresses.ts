
import { useState, useEffect } from 'react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { extractAddressComponents } from '@/utils/addressUtils';

export const usePickupAddresses = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load all addresses
  const loadAddresses = async (autoSelectDefault: boolean = true) => {
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      console.log("Loaded addresses:", savedAddresses);
      setAddresses(savedAddresses || []);
      
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
  const createAddress = async (addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">, useEncryption: boolean = true) => {
    setIsUpdating(true);
    try {
      console.log("Creating address with data:", addressData);
      
      // Validate required fields to ensure they're not empty
      if (!addressData.street1) throw new Error('Address line 1 is required');
      if (!addressData.city) throw new Error('City is required');
      if (!addressData.state) throw new Error('State is required');
      if (!addressData.zip) throw new Error('ZIP code is required');
      
      const newAddress = await addressService.createAddress(addressData, useEncryption);
      
      if (!newAddress) {
        throw new Error('Failed to create address');
      }
      
      console.log("Address created successfully:", newAddress);
      
      // If address should be default from, update it
      if (addressData.is_default_from) {
        await addressService.setDefaultFromAddress(newAddress.id);
      }
      
      // Update local state
      setAddresses(prev => [newAddress, ...prev]);
      
      // Auto-select if it's a default or if it's the first address
      if (addressData.is_default_from || addresses.length === 0) {
        setSelectedAddress(newAddress);
      }
      
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
  const updateAddress = async (addressId: number, addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">, useEncryption: boolean = true) => {
    setIsUpdating(true);
    try {
      console.log("Updating address with ID:", addressId, "and data:", addressData);
      
      // Validate required fields
      if (!addressData.street1) throw new Error('Address line 1 is required');
      if (!addressData.city) throw new Error('City is required');
      if (!addressData.state) throw new Error('State is required');
      if (!addressData.zip) throw new Error('ZIP code is required');
      
      const updatedAddress = await addressService.updateAddress(addressId, addressData, useEncryption);
      
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
        addr.id === addressId ? updatedAddress : addr
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
    const addressComponents = extractAddressComponents(place);
    console.log("Processing Google Place selection:", addressComponents);
    
    return {
      street1: addressComponents.street1,
      city: addressComponents.city,
      state: addressComponents.state,
      zip: addressComponents.zip,
      country: addressComponents.country
    };
  };

  return {
    addresses,
    selectedAddress,
    isLoading,
    isUpdating,
    loadAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setAsDefaultFrom,
    setSelectedAddress,
    processGooglePlaceSelection
  };
};

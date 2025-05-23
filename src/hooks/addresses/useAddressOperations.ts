
import { useState } from 'react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

/**
 * Hook to manage address creation, updating, and deletion
 */
export const useAddressOperations = (
  refreshAddresses: () => Promise<any>
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Create new address
  const createAddress = async (addressData: Omit<SavedAddress, "id" | "user_id" | "created_at">) => {
    setIsUpdating(true);
    try {
      console.log("Creating address with data:", addressData);
      
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
      await refreshAddresses(); // Reload addresses to ensure we have the latest data
      
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
      
      // Update local state through refresh
      await refreshAddresses();
      
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
      
      // Update local state through refresh
      await refreshAddresses();
      
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
  
  return {
    isUpdating,
    createAddress,
    updateAddress,
    deleteAddress
  };
};


import { useState } from 'react';
import { addressService } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

/**
 * Hook to manage default address operations
 */
export const useDefaultAddress = (
  refreshAddresses: () => Promise<any>
) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Set address as default from
  const setAsDefaultFrom = async (addressId: number) => {
    setIsUpdating(true);
    try {
      const success = await addressService.setDefaultFromAddress(addressId);
      
      if (!success) {
        throw new Error('Failed to set default address');
      }
      
      // Refresh addresses to update UI
      await refreshAddresses();
      
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

  return {
    isUpdating,
    setAsDefaultFrom
  };
};

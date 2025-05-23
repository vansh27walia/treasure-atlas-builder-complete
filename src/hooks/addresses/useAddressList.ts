
import { useState, useEffect } from 'react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

/**
 * Hook to manage the list of saved addresses
 */
export const useAddressList = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  return {
    addresses,
    selectedAddress,
    setSelectedAddress,
    isLoading,
    addressCount,
    ADDRESS_LIMIT,
    loadAddresses
  };
};

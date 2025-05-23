
import { useAddressList } from './useAddressList';
import { useAddressOperations } from './useAddressOperations';
import { useDefaultAddress } from './useDefaultAddress';
import { processGooglePlaceSelection } from '@/utils/addressProcessingUtils';

/**
 * Combined hook that provides all address management functionality
 * This is a facade that combines multiple specialized hooks
 */
export const usePickupAddresses = () => {
  const { 
    addresses, 
    selectedAddress, 
    setSelectedAddress,
    isLoading, 
    addressCount, 
    ADDRESS_LIMIT, 
    loadAddresses 
  } = useAddressList();

  const { 
    isUpdating: isCreatingOrUpdating, 
    createAddress, 
    updateAddress, 
    deleteAddress 
  } = useAddressOperations(loadAddresses);

  const { 
    isUpdating: isSettingDefault, 
    setAsDefaultFrom 
  } = useDefaultAddress(loadAddresses);

  // Combine the isUpdating states
  const isUpdating = isCreatingOrUpdating || isSettingDefault;

  return {
    // Address list state and operations
    addresses,
    selectedAddress,
    setSelectedAddress,
    isLoading,
    addressCount,
    ADDRESS_LIMIT,
    loadAddresses,
    
    // Address CRUD operations
    isUpdating,
    createAddress,
    updateAddress,
    deleteAddress,
    
    // Default address operations
    setAsDefaultFrom,
    
    // Utility functions
    processGooglePlaceSelection
  };
};

// Export sub-hooks for more granular usage if needed
export { useAddressList } from './useAddressList';
export { useAddressOperations } from './useAddressOperations';
export { useDefaultAddress } from './useDefaultAddress';

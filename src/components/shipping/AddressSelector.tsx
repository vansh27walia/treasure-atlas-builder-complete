
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { userProfileService } from '@/services/UserProfileService';
import { toast } from '@/components/ui/sonner';

import AddressSelectorHeader from './address/AddressSelectorHeader';
import AddressEmptyState from './address/AddressEmptyState';
import AddressDropdown from './address/AddressDropdown';
import AddressActions from './address/AddressActions';

interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect: (address: SavedAddress) => void;
  selectedAddressId?: number;
  allowAddNew?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type, 
  onAddressSelect,
  selectedAddressId,
  allowAddNew = true
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultAddressId, setDefaultAddressId] = useState<number | null>(null);
  const navigate = useNavigate();
  
  // Load saved addresses and default address from user profile
  const loadAddressData = async () => {
    setIsLoading(true);
    try {
      // Load all saved addresses
      const savedAddresses = await addressService.getSavedAddresses();
      
      if (savedAddresses.length === 0) {
        toast.info('No saved addresses found. Please add an address.');
      }
      
      setAddresses(savedAddresses);
      
      // Get the user profile to check for default pickup address
      if (type === 'from') {
        const userProfile = await userProfileService.getUserProfile();
        if (userProfile?.default_pickup_address_id) {
          setDefaultAddressId(userProfile.default_pickup_address_id);
        }
      }
      
      // Select default address if no address is already selected
      if (!selectedAddressId && savedAddresses.length > 0) {
        let addressToSelect: SavedAddress | undefined;
        
        if (type === 'from') {
          // First try the default from user profile
          if (defaultAddressId) {
            addressToSelect = savedAddresses.find(addr => addr.id === defaultAddressId);
          }
          
          // Then try default_from flag
          if (!addressToSelect) {
            addressToSelect = savedAddresses.find(addr => addr.is_default_from);
          }
        } else {
          // For 'to' addresses, check for default_to flag
          addressToSelect = savedAddresses.find(addr => addr.is_default_to);
        }
        
        // If still no address found, use the first one
        if (!addressToSelect && savedAddresses.length > 0) {
          addressToSelect = savedAddresses[0];
        }
        
        if (addressToSelect) {
          onAddressSelect(addressToSelect);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load address data on mount and when type changes
  useEffect(() => {
    loadAddressData();
  }, [type]); 
  
  // Refresh addresses when selectedAddressId changes externally
  useEffect(() => {
    if (selectedAddressId && addresses.length > 0) {
      const selected = addresses.find(addr => addr.id === selectedAddressId);
      if (!selected) {
        loadAddressData();
      }
    }
  }, [selectedAddressId]);
  
  const handleAddressChange = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.id === parseInt(addressId));
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
    }
  };
  
  const goToAddressSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="space-y-2">
      <AddressSelectorHeader type={type} allowAddNew={allowAddNew} />
      
      {isLoading ? (
        <AddressDropdown 
          addresses={[]}
          selectedAddressId={undefined}
          defaultAddressId={null}
          type={type}
          onAddressChange={() => {}}
        />
      ) : addresses.length === 0 ? (
        <AddressEmptyState onAddClick={goToAddressSettings} />
      ) : (
        <AddressDropdown 
          addresses={addresses}
          selectedAddressId={selectedAddressId}
          defaultAddressId={defaultAddressId}
          type={type}
          onAddressChange={handleAddressChange}
        />
      )}
      
      <AddressActions onRefresh={loadAddressData} />
    </div>
  );
};

export default AddressSelector;

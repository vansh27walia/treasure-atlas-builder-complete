
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { userProfileService } from '@/services/UserProfileService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Settings, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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
  
  const formatAddressForDisplay = (address: SavedAddress) => {
    const name = address.name || 'Unnamed Location';
    return `${name} - ${address.city}, ${address.state}`;
  };
  
  const goToAddressSettings = () => {
    navigate('/settings');
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {type === 'from' ? 'Pickup' : 'Delivery'} Address
        </h3>
        
        <div className="flex items-center gap-2">
          {allowAddNew && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={goToAddressSettings}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs" 
            onClick={goToAddressSettings}
          >
            <Settings className="h-3.5 w-3.5 mr-1" />
            Manage
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading addresses..." />
          </SelectTrigger>
        </Select>
      ) : addresses.length === 0 ? (
        <div className="text-sm text-gray-500 flex items-center justify-between bg-gray-50 border rounded-md p-3">
          <span>No saved addresses</span>
          <Button size="sm" variant="default" onClick={goToAddressSettings}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Address
          </Button>
        </div>
      ) : (
        <Select 
          value={selectedAddressId?.toString()} 
          onValueChange={handleAddressChange}
          defaultValue={defaultAddressId?.toString()}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id.toString()}>
                <div className="flex items-center">
                  <span>{formatAddressForDisplay(address)}</span>
                  {(type === 'from' && address.is_default_from) || 
                   (type === 'to' && address.is_default_to) || 
                   (type === 'from' && defaultAddressId === address.id) ? (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                      Default
                    </span>
                  ) : null}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Add a refresh button to manually reload addresses */}
      <div className="flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs" 
          onClick={() => loadAddressData()}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh Addresses
        </Button>
      </div>
    </div>
  );
};

export default AddressSelector;

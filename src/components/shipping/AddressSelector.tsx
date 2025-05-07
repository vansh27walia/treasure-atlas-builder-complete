
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Settings, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect: (address: SavedAddress) => void;
  selectedAddressId?: number;
  allowAddNew?: boolean;
  showSaveButton?: boolean;
  currentAddress?: Partial<SavedAddress>;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type, 
  onAddressSelect,
  selectedAddressId,
  allowAddNew = true,
  showSaveButton = false,
  currentAddress
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | undefined>(selectedAddressId);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  
  // Load saved addresses
  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses);
      
      // If we don't have a selected address yet and we have a default, select it
      if (!selectedId && savedAddresses.length > 0) {
        const defaultAddress = savedAddresses.find(addr => 
          type === 'from' ? addr.is_default_from : addr.is_default_to
        );
        
        if (defaultAddress) {
          setSelectedId(defaultAddress.id);
          onAddressSelect(defaultAddress);
          console.log(`Selected default ${type} address:`, defaultAddress);
        } else if (savedAddresses.length > 0) {
          setSelectedId(savedAddresses[0].id);
          onAddressSelect(savedAddresses[0]);
          console.log(`No default found, selected first ${type} address:`, savedAddresses[0]);
        }
      } else if (selectedId) {
        // If we already have a selected address ID, make sure it exists in our loaded addresses
        const selectedAddress = savedAddresses.find(addr => addr.id === selectedId);
        if (selectedAddress) {
          onAddressSelect(selectedAddress);
          console.log(`Using pre-selected ${type} address:`, selectedAddress);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error("Failed to load saved addresses");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadAddresses();
  }, []);

  // Update selected ID when prop changes
  useEffect(() => {
    if (selectedAddressId !== undefined && selectedAddressId !== selectedId) {
      setSelectedId(selectedAddressId);
    }
  }, [selectedAddressId]);
  
  const handleAddressChange = (addressId: string) => {
    const parsedId = parseInt(addressId);
    setSelectedId(parsedId);
    
    const selectedAddress = addresses.find(addr => addr.id === parsedId);
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
      console.log(`Selected ${type} address changed to:`, selectedAddress);
    }
  };
  
  const formatAddressForDisplay = (address: SavedAddress) => {
    const name = address.name || 'Unnamed Location';
    return `${name} - ${address.city}, ${address.state}`;
  };
  
  const goToAddressSettings = () => {
    navigate('/settings');
  };
  
  // Save current address to database
  const saveAddressToFile = async () => {
    if (!currentAddress) {
      toast.error("No address to save");
      return;
    }
    
    if (!currentAddress.street1 || !currentAddress.city || !currentAddress.state || !currentAddress.zip) {
      toast.error("Please fill all required address fields before saving");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Prepare address object
      const addressToSave: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'> = {
        name: currentAddress.name || `${currentAddress.city}, ${currentAddress.state}`,
        company: currentAddress.company,
        street1: currentAddress.street1,
        street2: currentAddress.street2,
        city: currentAddress.city,
        state: currentAddress.state,
        zip: currentAddress.zip,
        country: currentAddress.country || 'US',
        phone: currentAddress.phone,
        is_default_from: type === 'from',
        is_default_to: type === 'to'
      };
      
      // Save the address
      const savedAddress = await addressService.createAddress(addressToSave);
      if (savedAddress) {
        toast.success(`Address saved successfully`);
        console.log("Saved address:", savedAddress);
        
        // Refresh the address list
        await loadAddresses();
        
        // Select the newly saved address
        setSelectedId(savedAddress.id);
        onAddressSelect(savedAddress);
      } else {
        throw new Error("Failed to save address");
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {type === 'from' ? 'Pickup' : 'Delivery'} Address
        </h3>
        
        <div className="flex items-center gap-2">
          {showSaveButton && currentAddress && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={saveAddressToFile}
              disabled={isSaving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {isSaving ? 'Saving...' : 'Save Address'}
            </Button>
          )}
          
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
          value={selectedId?.toString()} 
          onValueChange={handleAddressChange}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select an address" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {addresses.map((address) => (
              <SelectItem key={address.id} value={address.id.toString()}>
                <div className="flex items-center">
                  <span>{formatAddressForDisplay(address)}</span>
                  {(type === 'from' && address.is_default_from) || 
                   (type === 'to' && address.is_default_to) ? (
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
    </div>
  );
};

export default AddressSelector;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, MapPin, Plus } from 'lucide-react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

interface SelectAddressDropdownProps {
  selectedAddress: SavedAddress | null;
  onAddressSelect: (address: SavedAddress | null) => void;
  addressType: 'pickup' | 'delivery';
  placeholder?: string;
  className?: string;
}

const SelectAddressDropdown: React.FC<SelectAddressDropdownProps> = ({
  selectedAddress,
  onAddressSelect,
  addressType,
  placeholder = "Select an address",
  className = ""
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    email: ''
  });

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropdownOpen = () => {
    if (!isOpen) {
      loadAddresses();
    }
    setIsOpen(!isOpen);
  };

  const handleAddressSelect = (address: SavedAddress) => {
    onAddressSelect(address);
    setIsOpen(false);
    setShowAddForm(false);
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.name || !newAddress.street1 || !newAddress.city || !newAddress.state || !newAddress.zip) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const savedAddress = await addressService.saveAddress(newAddress, addressType === 'pickup');
      setAddresses(prev => [...prev, savedAddress]);
      handleAddressSelect(savedAddress);
      setNewAddress({
        name: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        email: ''
      });
      toast.success('Address saved successfully');
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={handleDropdownOpen}
          >
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              {selectedAddress ? (
                <span className="truncate">
                  {selectedAddress.name} - {selectedAddress.street1}, {selectedAddress.city}
                </span>
              ) : (
                placeholder
              )}
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">Loading addresses...</div>
          ) : (
            <>
              {addresses.map((address) => (
                <DropdownMenuItem
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className="p-3"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{address.name}</div>
                    <div className="text-sm text-gray-600">
                      {address.street1}
                      {address.street2 && `, ${address.street2}`}
                    </div>
                    <div className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.zip}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              {addresses.length === 0 && !showAddForm && (
                <div className="p-4 text-center text-gray-500">
                  No saved addresses found
                </div>
              )}
              
              {/* Only show "Add New Address" for pickup addresses */}
              {addressType === 'pickup' && (
                <>
                  <DropdownMenuSeparator />
                  
                  {!showAddForm ? (
                    <DropdownMenuItem onClick={() => setShowAddForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Address
                    </DropdownMenuItem>
                  ) : (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Name *</Label>
                          <Input
                            value={newAddress.name}
                            onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                            placeholder="Full name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Company</Label>
                          <Input
                            value={newAddress.company}
                            onChange={(e) => setNewAddress({...newAddress, company: e.target.value})}
                            placeholder="Company"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs">Street Address *</Label>
                        <Input
                          value={newAddress.street1}
                          onChange={(e) => setNewAddress({...newAddress, street1: e.target.value})}
                          placeholder="Street address"
                          className="text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs">Apt, Suite, etc.</Label>
                        <Input
                          value={newAddress.street2}
                          onChange={(e) => setNewAddress({...newAddress, street2: e.target.value})}
                          placeholder="Apartment, suite, etc."
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">City *</Label>
                          <Input
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            placeholder="City"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">State *</Label>
                          <Input
                            value={newAddress.state}
                            onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                            placeholder="State"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ZIP *</Label>
                          <Input
                            value={newAddress.zip}
                            onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                            placeholder="ZIP"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input
                            value={newAddress.phone}
                            onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                            placeholder="Phone"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Email</Label>
                          <Input
                            value={newAddress.email}
                            onChange={(e) => setNewAddress({...newAddress, email: e.target.value})}
                            placeholder="Email"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSaveNewAddress}
                          size="sm"
                          className="flex-1"
                        >
                          Save Address
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAddForm(false)}
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SelectAddressDropdown;

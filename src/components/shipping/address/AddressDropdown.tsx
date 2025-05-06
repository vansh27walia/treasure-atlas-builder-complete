
import React from 'react';
import { SavedAddress } from '@/services/AddressService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddressDropdownProps {
  addresses: SavedAddress[];
  selectedAddressId?: number;
  defaultAddressId: number | null;
  type: 'from' | 'to';
  onAddressChange: (addressId: string) => void;
}

const AddressDropdown: React.FC<AddressDropdownProps> = ({ 
  addresses, 
  selectedAddressId,
  defaultAddressId, 
  type, 
  onAddressChange 
}) => {
  const formatAddressForDisplay = (address: SavedAddress) => {
    const name = address.name || 'Unnamed Location';
    return `${name} - ${address.city}, ${address.state}`;
  };

  return (
    <Select 
      value={selectedAddressId?.toString()} 
      onValueChange={onAddressChange}
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
  );
};

export default AddressDropdown;

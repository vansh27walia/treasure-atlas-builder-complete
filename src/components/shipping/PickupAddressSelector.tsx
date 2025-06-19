
import React from 'react';
import SelectAddressDropdown from './SelectAddressDropdown';
import { SavedAddress } from '@/services/AddressService';

interface PickupAddressSelectorProps {
  selectedAddress: SavedAddress | null;
  onAddressSelected: (address: SavedAddress | null) => void;
  onAddNew: () => void;
  className?: string;
}

const PickupAddressSelector: React.FC<PickupAddressSelectorProps> = ({
  selectedAddress,
  onAddressSelected,
  onAddNew,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Pickup Address
      </label>
      <SelectAddressDropdown
        defaultAddress={selectedAddress}
        onAddressSelected={onAddressSelected}
        onAddNew={onAddNew}
        placeholder="Select pickup address"
        isPickupAddress={true}
        className="w-full"
      />
    </div>
  );
};

export default PickupAddressSelector;

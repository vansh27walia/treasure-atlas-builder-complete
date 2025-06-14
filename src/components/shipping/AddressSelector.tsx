import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addressService } from '@/services/AddressService';
import { SavedAddress } from '@/types/shipping'; // Changed import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import AddressForm, { AddressFormData } from './AddressForm';
import { PlusCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface AddressSelectorProps {
  selectedAddressId?: string | null;
  onAddressSelect: (address: SavedAddress | null) => void;
  addressType?: 'from' | 'to'; // To customize labels and default toggles
  disabled?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddressId,
  onAddressSelect,
  addressType = 'to',
  disabled = false,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');


  const { data: addresses = [], isLoading: isLoadingAddresses, refetch } = useQuery<SavedAddress[], Error>({
    queryKey: ['savedAddresses'],
    queryFn: addressService.getSavedAddresses,
  });

  const handleSelectChange = (addressId: string) => {
    if (addressId === 'add_new') {
      setIsAddDialogOpen(true);
    } else {
      const selected = addresses.find(addr => addr.id === addressId);
      onAddressSelect(selected || null);
    }
  };

  const handleAddNewAddress = async (data: AddressFormData) => {
    try {
      const newAddress = await addressService.addAddress({
        ...data,
        // Set default based on addressType if specified in form
        is_default_from: addressType === 'from' ? data.is_default_from : undefined,
        is_default_to: addressType === 'to' ? data.is_default_to : undefined,
      });
      await refetch(); // Refetch addresses to include the new one
      onAddressSelect(newAddress); // Select the newly added address
      setIsAddDialogOpen(false);
      toast.success("Address added and selected!");
    } catch (error: any) {
      toast.error(`Failed to add address: ${error.message}`);
      console.error("Failed to add address:", error);
    }
  };

  const filteredAddresses = addresses.filter(addr => 
    `${addr.name} ${addr.street1} ${addr.city} ${addr.zip}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Select
          value={selectedAddressId || ''}
          onValueChange={handleSelectChange}
          disabled={disabled || isLoadingAddresses}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder={isLoadingAddresses ? "Loading addresses..." : `Select ${addressType === 'from' ? 'sender' : 'recipient'} address`} />
          </SelectTrigger>
          <SelectContent>
            {isLoadingAddresses && <SelectItem value="loading" disabled><Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" />Loading...</SelectItem>}
            {!isLoadingAddresses && addresses.length === 0 && <SelectItem value="no_address" disabled>No saved addresses</SelectItem>}
            {filteredAddresses.map((address) => (
              <SelectItem key={address.id} value={address.id}>
                {address.name} - {address.street1}, {address.city}
              </SelectItem>
            ))}
             <SelectItem value="add_new" className="text-blue-600">
                <PlusCircle className="h-4 w-4 mr-2 inline-block" />
                Add New Address
            </SelectItem>
          </SelectContent>
        </Select>
         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsAddDialogOpen(true)} disabled={disabled}>
                    <PlusCircle className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Add New {addressType === 'from' ? 'Sender' : 'Recipient'} Address</DialogTitle>
                <DialogDescription>Enter the details for the new address.</DialogDescription>
                </DialogHeader>
                <AddressForm
                    onSubmit={handleAddNewAddress}
                    submitButtonText="Add Address"
                    showDefaultToggle={true}
                    defaultToggleLabel={`Set as default ${addressType === 'from' ? 'pickup' : 'recipient'} address`}
                    defaultToggleField={addressType === 'from' ? 'is_default_from' : 'is_default_to'}
                />
            </DialogContent>
        </Dialog>
      </div>
       {/* Search input if needed */}
       {/* addresses.length > 5 && (
        <Input 
          type="text"
          placeholder="Search addresses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-1"
        />
      )*/}
    </div>
  );
};

export default AddressSelector;

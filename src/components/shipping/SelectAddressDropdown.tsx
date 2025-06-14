import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService } from '@/services/AddressService';
import { SavedAddress } from '@/types/shipping'; // Changed import
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Edit3, Trash2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import AddressForm, { AddressFormData } from './AddressForm';
import { toast } from '@/components/ui/sonner';

interface SelectAddressDropdownProps {
  value?: string; // Address ID
  onChange: (addressId: string | undefined) => void;
  onAddressHydrate?: (address: SavedAddress | null) => void; // Callback with full address object
  addressType: 'from' | 'to';
  disabled?: boolean;
}

const SelectAddressDropdown: React.FC<SelectAddressDropdownProps> = ({
  value,
  onChange,
  onAddressHydrate,
  addressType,
  disabled,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading: isLoadingAddresses, refetch } = useQuery<SavedAddress[], Error>({
    queryKey: ['savedAddresses', addressType], // Query key can be more specific if needed
    queryFn: async () => {
      // No need to get session here, addressService handles it
      return addressService.getSavedAddresses();
    }
  });
  
  const addAddressMutation = useMutation({
    mutationFn: (data: AddressFormData) => {
        const payload: Omit<SavedAddress, 'id' | 'user_id' | 'created_at' | 'updated_at'> = { ...data };
        if (addressType === 'from') payload.is_default_from = data.is_default_from;
        if (addressType === 'to') payload.is_default_to = data.is_default_to;
        return addressService.addAddress(payload);
    },
    onSuccess: (newAddress) => {
        queryClient.invalidateQueries({ queryKey: ['savedAddresses', addressType] });
        onChange(newAddress.id);
        if (onAddressHydrate) onAddressHydrate(newAddress);
        setIsFormOpen(false);
        setEditingAddress(null);
        toast.success("Address added successfully!");
    },
    onError: (error: Error) => {
        toast.error(`Failed to add address: ${error.message}`);
    }
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({id, data}: {id: string, data: AddressFormData}) => {
        const payload: Partial<SavedAddress> = { ...data };
        // Retain original default status if not explicitly changed by this form
        if (addressType === 'from' && data.is_default_from !== undefined) payload.is_default_from = data.is_default_from;
        else if (addressType === 'from') delete payload.is_default_from;

        if (addressType === 'to' && data.is_default_to !== undefined) payload.is_default_to = data.is_default_to;
        else if (addressType === 'to') delete payload.is_default_to;
        
        return addressService.updateAddress(id, payload);
    },
    onSuccess: (updatedAddress) => {
        queryClient.invalidateQueries({ queryKey: ['savedAddresses', addressType] });
        onChange(updatedAddress.id);
        if (onAddressHydrate) onAddressHydrate(updatedAddress);
        setIsFormOpen(false);
        setEditingAddress(null);
        toast.success("Address updated successfully!");
    },
    onError: (error: Error) => {
        toast.error(`Failed to update address: ${error.message}`);
    }
  });


  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === 'add_new') {
      setEditingAddress(null); // Clear editing state for new address
      setIsFormOpen(true);
    } else {
      onChange(selectedValue);
      if (onAddressHydrate) {
        const selectedAddr = addresses.find(a => a.id === selectedValue);
        onAddressHydrate(selectedAddr || null);
      }
    }
  };
  
  const handleFormSubmit = (data: AddressFormData) => {
    if (editingAddress && editingAddress.id) {
        updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
        addAddressMutation.mutate(data);
    }
  };

  const openEditForm = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={handleSelectChange} value={value || ''} disabled={disabled || isLoadingAddresses}>
        <SelectTrigger className="flex-grow">
          <SelectValue placeholder={isLoadingAddresses ? "Loading..." : `Select ${addressType === 'from' ? 'Origin' : 'Destination'}`} />
        </SelectTrigger>
        <SelectContent>
          {isLoadingAddresses && <SelectItem value="loading" disabled><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</SelectItem>}
          {!isLoadingAddresses && addresses.map((address) => (
            <SelectItem key={address.id} value={address.id}>
              <div className="flex justify-between items-center w-full">
                <span>{address.name} - {address.street1}, {address.city}</span>
                <Button variant="ghost" size="sm" className="p-1 h-auto" onClick={(e) => { e.stopPropagation(); openEditForm(address); }}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="add_new" className="text-blue-600 hover:text-blue-700">
            <PlusCircle className="inline-block mr-2 h-4 w-4" /> Add New Address
          </SelectItem>
        </SelectContent>
      </Select>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" onClick={() => { setEditingAddress(null); setIsFormOpen(true); }} disabled={disabled}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit' : 'Add New'} {addressType === 'from' ? 'Origin' : 'Destination'} Address</DialogTitle>
          </DialogHeader>
          <AddressForm
            onSubmit={handleFormSubmit}
            defaultValues={editingAddress ? {
                ...editingAddress,
                is_default_from: addressType === 'from' ? editingAddress.is_default_from : undefined,
                is_default_to: addressType === 'to' ? editingAddress.is_default_to : undefined,
            } : { country: 'US', is_residential: true }}
            isLoading={addAddressMutation.isPending || updateAddressMutation.isPending}
            submitButtonText={editingAddress ? "Update Address" : "Add Address"}
            showDefaultToggle={true}
            defaultToggleLabel={`Set as default ${addressType === 'from' ? 'origin' : 'destination'}`}
            defaultToggleField={addressType === 'from' ? 'is_default_from' : 'is_default_to'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SelectAddressDropdown;

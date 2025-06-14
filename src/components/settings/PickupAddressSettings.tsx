import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressService } from '@/services/AddressService';
import { SavedAddress } from '@/types/shipping'; // Changed import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/components/ui/sonner';
import { PlusCircle, Edit3, Trash2, Home, CheckCircle, Loader2 } from 'lucide-react';
import AddressFormFields from '@/components/shipping/AddressFormFields';

// Define Zod schema for address form
const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  is_residential: z.boolean().optional(),
  is_default_from: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;


const PickupAddressSettings: React.FC = () => {
  // State variables for dialogs and editing address
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const queryClient = useQueryClient();

  const { data: addresses, isLoading: isLoadingAddresses, error: addressesError } = useQuery<SavedAddress[], Error>({
    queryKey: ['savedAddresses'],
    queryFn: addressService.getSavedAddresses,
  });

  const addAddressMutation = useMutation({
    mutationFn: (addressData: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => addressService.addAddress(addressData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      queryClient.invalidateQueries({queryKey: ['defaultFromAddress']});
      toast.success('Address added successfully!');
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to add address: ${error.message}`);
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SavedAddress> }) => addressService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      queryClient.invalidateQueries({queryKey: ['defaultFromAddress']});
      toast.success('Address updated successfully!');
      setIsEditDialogOpen(false);
      setEditingAddress(null);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update address: ${error.message}`);
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      queryClient.invalidateQueries({queryKey: ['defaultFromAddress']});
      toast.success('Address deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete address: ${error.message}`);
    },
  });

  const setDefaultFromMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefaultFromAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedAddresses'] });
      queryClient.invalidateQueries({queryKey: ['defaultFromAddress']});
      toast.success('Default pickup address updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set default address: ${error.message}`);
    }
  });

  const { control, handleSubmit, reset, formState: { errors: formErrors } } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US', is_residential: true, is_default_from: false },
  });

  const handleOpenAddDialog = () => {
    reset({ country: 'US', is_residential: true, is_default_from: false, name: '', street1: '', city: '', state: '', zip: '' });
    setEditingAddress(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (address: SavedAddress) => {
    setEditingAddress(address);
    reset({
      id: address.id,
      name: address.name || '',
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      email: address.email || '',
      is_residential: address.is_residential ?? true,
      is_default_from: address.is_default_from ?? false,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: AddressFormData) => {
    const addressPayload = {
        name: data.name,
        company: data.company,
        street1: data.street1,
        street2: data.street2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        country: data.country,
        phone: data.phone,
        email: data.email,
        is_residential: data.is_residential,
        is_default_from: data.is_default_from,
    };

    if (editingAddress && editingAddress.id) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressPayload });
    } else {
      addAddressMutation.mutate(addressPayload);
    }
  };
  
  // Render loading state
  if (isLoadingAddresses) {
    return <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  // Render error state
  if (addressesError) {
    return <div className="text-red-500">Error loading addresses: {addressesError.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Pickup Addresses</CardTitle>
            <CardDescription>Manage your saved pickup locations for shipments.</CardDescription>
          </div>
          <Button onClick={handleOpenAddDialog} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {addresses && addresses.length > 0 ? (
          <ul className="space-y-4">
            {addresses.map((address) => (
              <li key={address.id} className={`p-4 border rounded-lg flex justify-between items-start ${address.is_default_from ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                <div>
                  <p className="font-semibold text-gray-800">{address.name} {address.company && `(${address.company})`}</p>
                  <p className="text-sm text-gray-600">{address.street1}, {address.street2 && `${address.street2}, `}{address.city}, {address.state} {address.zip}, {address.country}</p>
                  <p className="text-xs text-gray-500">{address.phone && `Phone: ${address.phone}`} {address.email && `Email: ${address.email}`}</p>
                  {address.is_default_from && (
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" /> Default Pickup
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  {!address.is_default_from && (
                    <Button variant="outline" size="sm" onClick={() => setDefaultFromMutation.mutate(address.id)} disabled={setDefaultFromMutation.isPending}>
                      <Home className="mr-1 h-3.5 w-3.5" /> Set Default
                    </Button>
                  )}
                   <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(address)} className="text-blue-600 hover:text-blue-800 h-8 w-8">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800 h-8 w-8" disabled={address.is_default_from}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>Are you sure you want to delete this address? This action cannot be undone.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button variant="destructive" onClick={() => deleteAddressMutation.mutate(address.id)} disabled={deleteAddressMutation.isPending}>
                                {deleteAddressMutation.isPending ? 'Deleting...' : 'Delete'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 py-8">No pickup addresses saved yet. Add one to get started!</p>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={isAddDialogOpen ? setIsAddDialogOpen : setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update the details of your address.' : 'Enter the details for your new address.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <AddressFormFields control={control} errors={formErrors} showDefaultToggle={true} defaultToggleLabel="Set as default pickup address" defaultToggleField="is_default_from" />
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit" disabled={addAddressMutation.isPending || updateAddressMutation.isPending}>
                {(addAddressMutation.isPending || updateAddressMutation.isPending) ? 'Saving...' : 'Save Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PickupAddressSettings;

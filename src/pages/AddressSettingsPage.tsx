import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormEvent } from 'react';
import { pickupAddressService, PickupAddress } from '@/services/PickupAddressService';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Home, Plus, Trash2, Edit, CheckCircle, MapPin } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// We'll use the PickupAddress type directly from the service
// so we don't need to redefine it here

const AddressCard: React.FC<{
  address: PickupAddress;
  onEdit: (address: PickupAddress) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  isDeleteLoading: boolean;
  isDefaultLoading: boolean;
}> = ({ address, onEdit, onDelete, onSetDefault, isDeleteLoading, isDefaultLoading }) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{address.name}</CardTitle>
            {address.company && <CardDescription>{address.company}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => onEdit(address)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete address</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this address? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => address.id && onDelete(address.id)}
                    disabled={isDeleteLoading}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    {isDeleteLoading ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {address.is_default_from && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Default pickup address</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="text-sm space-y-1.5 pt-0">
        <p>{address.street1}</p>
        {address.street2 && <p>{address.street2}</p>}
        <p>
          {address.city}, {address.state} {address.zip}
        </p>
        <p>{address.country}</p>
        {address.phone && <p>{address.phone}</p>}
      </CardContent>

      {!address.is_default_from && (
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => address.id && onSetDefault(address.id)}
            disabled={isDefaultLoading}
            className="text-sm text-blue-600"
          >
            Set as default
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

const AddressSettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PickupAddress | null>(null);
  const [formAddress, setFormAddress] = useState<PickupAddress>({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    is_default_from: false
  });

  // Fetch addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['pickup-addresses'],
    queryFn: () => pickupAddressService.getSavedAddresses(),
  });

  // Add address mutation
  const createAddressMutation = useMutation({
    mutationFn: (newAddress: PickupAddress) => pickupAddressService.createAddress(newAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-addresses'] });
      toast.success('Address added successfully');
      setIsAddressDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add address: ${error.message}`);
    }
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, updatedAddress }: { id: number; updatedAddress: PickupAddress }) => 
      pickupAddressService.updateAddress(id, updatedAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-addresses'] });
      toast.success('Address updated successfully');
      setIsAddressDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update address: ${error.message}`);
    }
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => pickupAddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-addresses'] });
      toast.success('Address deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete address: ${error.message}`);
    }
  });

  // Set default address mutation
  const setDefaultAddressMutation = useMutation({
    mutationFn: (id: number) => pickupAddressService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-addresses'] });
      toast.success('Default address updated');
    },
    onError: (error) => {
      toast.error(`Failed to set default address: ${error.message}`);
    }
  });

  const resetForm = () => {
    setFormAddress({
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      is_default_from: false
    });
    setEditingAddress(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddressDialogOpen(true);
  };

  const handleEditAddress = (address: PickupAddress) => {
    setEditingAddress(address);
    setFormAddress({
      ...address,
      street2: address.street2 || '',
    });
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = (id: number) => {
    deleteAddressMutation.mutate(id);
  };

  const handleSetDefaultAddress = (id: number) => {
    setDefaultAddressMutation.mutate(id);
  };

  const handleAddressSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formAddress.name || !formAddress.street1 || !formAddress.city || 
        !formAddress.state || !formAddress.zip || !formAddress.country) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingAddress?.id) {
      updateAddressMutation.mutate({ 
        id: editingAddress.id, 
        updatedAddress: formAddress 
      });
    } else {
      createAddressMutation.mutate(formAddress);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Address Settings</h1>
        <p className="text-gray-500 mt-1">Manage your pickup addresses and default settings</p>
      </header>

      <Tabs defaultValue="pickup" className="mb-8">
        <TabsList>
          <TabsTrigger value="pickup" className="flex items-center gap-1.5">
            <Home className="h-4 w-4" />
            Pickup Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pickup" className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Pickup Addresses</h2>
            <Button onClick={handleOpenAddDialog} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading addresses...</div>
          ) : addresses && addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={handleEditAddress}
                  onDelete={handleDeleteAddress}
                  onSetDefault={handleSetDefaultAddress}
                  isDeleteLoading={deleteAddressMutation.isPending}
                  isDefaultLoading={setDefaultAddressMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center border rounded-lg bg-gray-50">
              <MapPin className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium mb-1">No addresses yet</h3>
              <p className="text-gray-500 mb-4">Add a pickup address to get started with shipping</p>
              <Button onClick={handleOpenAddDialog}>Add Address</Button>
            </div>
          )}
          
          <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                <DialogDescription>
                  {editingAddress
                    ? 'Update your pickup address details below'
                    : 'Fill in the details for your new pickup address'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formAddress.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={formAddress.company}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street1">Street Address *</Label>
                  <Input
                    id="street1"
                    name="street1"
                    value={formAddress.street1}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street2">Apartment, Suite, etc.</Label>
                  <Input
                    id="street2"
                    name="street2"
                    value={formAddress.street2}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formAddress.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formAddress.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP/Postal Code *</Label>
                    <Input
                      id="zip"
                      name="zip"
                      value={formAddress.zip}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formAddress.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formAddress.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_default_from"
                    name="is_default_from"
                    checked={formAddress.is_default_from}
                    onCheckedChange={(checked) =>
                      setFormAddress((prev) => ({ ...prev, is_default_from: checked }))
                    }
                  />
                  <Label htmlFor="is_default_from">Set as default pickup address</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddressDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  >
                    {createAddressMutation.isPending || updateAddressMutation.isPending
                      ? 'Saving...'
                      : editingAddress ? 'Update Address' : 'Add Address'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddressSettingsPage;

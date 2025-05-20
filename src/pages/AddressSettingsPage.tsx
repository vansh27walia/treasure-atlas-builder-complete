import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { pickupAddressService, PickupAddress } from '@/services/PickupAddressService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  company: z.string().optional(),
  street1: z.string().min(2, {
    message: "Street address must be at least 2 characters.",
  }),
  street2: z.string().optional(),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  zip: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }),
  phone: z.string().optional(),
  is_default_from: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof formSchema>

const AddressSettingsPage = () => {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingAddress, setEditingAddress] = useState<PickupAddress | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { 
    data: addresses, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => pickupAddressService.getSavedAddresses(),
  });
  
  const form = useForm<AddressFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      company: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      phone: "",
      is_default_from: false,
    },
  })
  
  const { mutate: createAddressMutation } = useMutation(
    (newAddress: PickupAddress) => pickupAddressService.createAddress(newAddress),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        toast.success('Address created successfully');
        setShowAddressModal(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error('Failed to create address: ' + (error?.message || 'Unknown error'));
      },
      onSettled: () => {
        setIsCreating(false);
      },
    }
  );
  
  const { mutate: updateAddressMutation } = useMutation(
    ({ id, updatedAddress }: { id: number, updatedAddress: PickupAddress }) => pickupAddressService.updateAddress(id, updatedAddress),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        toast.success('Address updated successfully');
        setShowAddressModal(false);
        resetForm();
      },
      onError: (error: any) => {
        toast.error('Failed to update address: ' + (error?.message || 'Unknown error'));
      },
      onSettled: () => {
        setIsUpdating(false);
      },
    }
  );
  
  const { mutate: deleteAddressMutation } = useMutation(
    (id: number) => pickupAddressService.deleteAddress(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        toast.success('Address deleted successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to delete address: ' + (error?.message || 'Unknown error'));
      },
    }
  );
  
  const { mutate: setDefaultAddressMutation } = useMutation(
    (id: number) => pickupAddressService.setDefaultAddress(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['addresses'] });
        toast.success('Default address updated successfully');
      },
      onError: (error: any) => {
        toast.error('Failed to set default address: ' + (error?.message || 'Unknown error'));
      },
    }
  );

  const handleCreateAddress = async (formData: AddressFormData) => {
    setIsCreating(true);
    try {
      // Make sure all required properties are present
      const newAddress: PickupAddress = {
        name: formData.name || '', // Ensure name is provided as it's required
        company: formData.company,
        street1: formData.street1 || '', // Ensure street1 is provided as it's required
        street2: formData.street2,
        city: formData.city || '', // Ensure city is provided as it's required
        state: formData.state || '', // Ensure state is provided as it's required
        zip: formData.zip || '', // Ensure zip is provided as it's required
        country: formData.country || 'US', // Default to US if not provided
        phone: formData.phone,
        is_default_from: formData.is_default_from || false
      };
      
      createAddressMutation(newAddress);
    } catch (error) {
      console.error('Error creating address:', error);
      toast.error('Failed to create address: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateAddress = async (formData: AddressFormData) => {
    if (!editingAddress?.id) return;
    
    setIsUpdating(true);
    try {
      // Make sure all required properties are present
      const updatedAddress: PickupAddress = {
        name: formData.name || '', // Ensure name is provided as it's required
        company: formData.company,
        street1: formData.street1 || '', // Ensure street1 is provided as it's required
        street2: formData.street2,
        city: formData.city || '', // Ensure city is provided as it's required
        state: formData.state || '', // Ensure state is provided as it's required
        zip: formData.zip || '', // Ensure zip is provided as it's required
        country: formData.country || 'US', // Default to US if not provided
        phone: formData.phone,
        is_default_from: formData.is_default_from || false
      };
      
      updateAddressMutation({ id: editingAddress.id, updatedAddress });
    } catch (error) {
      console.error('Error updating address:', error);
      toast.error('Failed to update address: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteAddress = (id: number) => {
    deleteAddressMutation(id);
  };
  
  const handleSetDefaultAddress = (id: number) => {
    setDefaultAddressMutation(id);
  };

  const onSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      handleUpdateAddress(data);
    } else {
      handleCreateAddress(data);
    }
  }
  
  const resetForm = () => {
    form.reset({
      name: "",
      company: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      phone: "",
      is_default_from: false,
    });
    setEditingAddress(null);
  };
  
  const handleEditAddress = (address: PickupAddress) => {
    setEditingAddress(address);
    form.setValue("name", address.name);
    form.setValue("company", address.company || "");
    form.setValue("street1", address.street1);
    form.setValue("street2", address.street2 || "");
    form.setValue("city", address.city);
    form.setValue("state", address.state);
    form.setValue("zip", address.zip);
    form.setValue("country", address.country);
    form.setValue("phone", address.phone || "");
    form.setValue("is_default_from", address.is_default_from);
    setShowAddressModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Pickup Addresses</h1>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          <SettingsIcon className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>
      
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Manage Pickup Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Address</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingAddress ? 'Edit Address' : 'Create Address'}</DialogTitle>
                  <DialogDescription>
                    {editingAddress ? 'Update your address details.' : 'Add a new address to your account.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="ACME Corp" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="street1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address 1</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="street2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address 2 (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="New York" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="NY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input placeholder="10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="US" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="is_default_from"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">Set as Default From Address</FormLabel>
                            <FormDescription>
                              This address will be used as the default pickup address.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isCreating || isUpdating}>
                      {isCreating ? "Creating..." : (isUpdating ? "Updating..." : "Submit")}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center">
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Loading addresses...
            </div>
          ) : isError ? (
            <div className="text-red-500">Error loading addresses. Please try again.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Street 1</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Zip</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addresses?.map((address) => (
                    <TableRow key={address.id}>
                      <TableCell>{address.name}</TableCell>
                      <TableCell>{address.company}</TableCell>
                      <TableCell>{address.street1}</TableCell>
                      <TableCell>{address.city}</TableCell>
                      <TableCell>{address.state}</TableCell>
                      <TableCell>{address.zip}</TableCell>
                      <TableCell>{address.country}</TableCell>
                      <TableCell>{address.phone}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={address.is_default_from}
                          onCheckedChange={() => handleSetDefaultAddress(address.id as number)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            onClick={() => handleDeleteAddress(address.id as number)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface FormDescriptionProps {
  children?: React.ReactNode;
}

function FormDescription({ children, ...props }: FormDescriptionProps) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground",
        props.className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export default AddressSettingsPage;

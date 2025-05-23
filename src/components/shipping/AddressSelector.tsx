
// If this file exists and uses usePickupAddresses, update the import path
// For demonstration purposes - you would need to update this in any file that imports usePickupAddresses

// Update from:
// import { usePickupAddresses } from '@/hooks/usePickupAddresses';
// To:
import { usePickupAddresses } from '@/hooks/addresses/usePickupAddresses';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/sonner"
import { SavedAddress } from '@/services/AddressService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from 'lucide-react';
import { Circle } from 'lucide-react';
import { useAddressList } from '@/hooks/addresses/useAddressList';
import { useAddressOperations } from '@/hooks/addresses/useAddressOperations';
import { useDefaultAddress } from '@/hooks/addresses/useDefaultAddress';
import { processGooglePlaceSelection } from '@/utils/addressProcessingUtils';
import { cn } from '@/lib/utils';

const addressFormSchema = z.object({
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
  is_default_from: z.boolean().default(false),
  is_default_to: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressFormSchema>

interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect: (address: SavedAddress | null) => void;
  selectedAddressId?: number | null;
  useGoogleAutocomplete?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type, 
  onAddressSelect, 
  selectedAddressId,
  useGoogleAutocomplete = false 
}) => {
  const { 
    addresses, 
    selectedAddress, 
    setSelectedAddress, 
    isLoading, 
    addressCount, 
    ADDRESS_LIMIT, 
    loadAddresses 
  } = useAddressList();
  const { 
    isUpdating: isCreatingOrUpdating, 
    createAddress, 
    updateAddress, 
    deleteAddress 
  } = useAddressOperations(loadAddresses);
  const { 
    isUpdating: isSettingDefault, 
    setAsDefaultFrom 
  } = useDefaultAddress(loadAddresses);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<SavedAddress | null>(null);
  const [googlePlace, setGooglePlace] = useState<GoogleMapsPlace | null>(null);
  const [isGooglePlaceProcessing, setIsGooglePlaceProcessing] = useState(false);

  // Initialize react-hook-form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: "",
      company: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      is_default_from: false,
      is_default_to: false,
    },
  });

  // Load addresses on component mount
  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Set selected address based on prop
  useEffect(() => {
    if (selectedAddressId) {
      const address = addresses.find(addr => addr.id === selectedAddressId);
      setSelectedAddress(address || null);
    }
  }, [selectedAddressId, addresses, setSelectedAddress]);

  // Handle address selection
  const handleAddressSelect = (address: SavedAddress) => {
    setSelectedAddress(address);
    onAddressSelect(address);
  };

  // Handle address creation
  const handleAddressCreate = async (values: AddressFormValues) => {
    try {
      await createAddress({
        ...values,
        is_default_to: false, // Ensure this property exists
      });
      toast.success('Address created successfully!');
      setIsAdding(false);
      form.reset();
    } catch (error) {
      console.error("Error creating address:", error);
      toast.error('Failed to create address.');
    }
  };

  // Handle address update
  const handleAddressUpdate = async (values: AddressFormValues) => {
    if (!addressToEdit) {
      toast.error('No address selected for update.');
      return;
    }
    
    try {
      await updateAddress(addressToEdit.id, {
        ...values,
        is_default_to: addressToEdit.is_default_to || false, // Ensure this property exists
      });
      toast.success('Address updated successfully!');
      setIsEditing(false);
      setAddressToEdit(null);
      form.reset();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error('Failed to update address.');
    }
  };

  // Handle address deletion
  const handleAddressDelete = async (addressId: number) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(addressId);
        toast.success('Address deleted successfully!');
      } catch (error) {
        console.error("Error deleting address:", error);
        toast.error('Failed to delete address.');
      }
    }
  };

  // Handle setting default address
  const handleSetDefault = async (addressId: number) => {
    try {
      await setAsDefaultFrom(addressId);
    } catch (error) {
      console.error("Error setting default address:", error);
      toast.error('Failed to set default address.');
    }
  };

  // Handle Google Place selection
  const handleGooglePlaceSelect = async (place: GoogleMapsPlace) => {
    setIsGooglePlaceProcessing(true);
    try {
      const addressData = processGooglePlaceSelection(place);
      if (Object.keys(addressData).length > 0) {
        form.setValue('street1', addressData.street1 || '');
        form.setValue('city', addressData.city || '');
        form.setValue('state', addressData.state || '');
        form.setValue('zip', addressData.zip || '');
        form.setValue('country', addressData.country || 'US');
        setGooglePlace(place);
      }
    } catch (error) {
      console.error("Error processing Google Place:", error);
      toast.error('Failed to process Google Place.');
    } finally {
      setIsGooglePlaceProcessing(false);
    }
  };

  // Handle edit address
  const handleEditAddress = (address: SavedAddress) => {
    setAddressToEdit(address);
    form.setValue('name', address.name || '');
    form.setValue('company', address.company || '');
    form.setValue('street1', address.street1);
    form.setValue('street2', address.street2 || '');
    form.setValue('city', address.city);
    form.setValue('state', address.state);
    form.setValue('zip', address.zip);
    form.setValue('country', address.country || 'US');
    form.setValue('is_default_from', address.is_default_from || false);
    setIsEditing(true);
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setAddressToEdit(null);
    form.reset();
  };

  return (
    <div>
      {/* Address List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium">
          {addresses.length > 0 ? 'Select an existing address:' : 'No addresses saved yet. Add a new one:'}
        </h4>
        {isLoading ? (
          <p>Loading addresses...</p>
        ) : (
          <>
            {addresses.length > 0 ? (
              <div className="flex flex-col space-y-2 mt-2">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className={cn(
                      "border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200",
                      selectedAddress?.id === address.id ? "bg-blue-50 border-blue-300" : "bg-white"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">{address.name || 'Unnamed'}</h4>
                          <p className="text-xs text-gray-600">
                            {address.street1}, {address.street2 && `${address.street2}, `}
                            {address.city}, {address.state} {address.zip}, {address.country}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddressSelect(address)}
                            className={selectedAddress?.id === address.id ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                          >
                            <Circle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(address)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-edit"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              <path d="m15 5 2 2" />
                            </svg>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleAddressDelete(address.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-2">No addresses saved yet.</p>
            )}
          </>
        )}
      </div>

      {/* Add Address Button */}
      {!isAdding && !isEditing && addressCount < ADDRESS_LIMIT && (
        <Button onClick={() => setIsAdding(true)} disabled={isCreatingOrUpdating}>
          Add New Address
        </Button>
      )}

      {/* Address Form */}
      {(isAdding || isEditing) && (
        <Card className="border border-gray-200 rounded-lg shadow-sm mt-4">
          <CardHeader>
            <CardTitle>{isAdding ? 'Add New Address' : 'Edit Address'}</CardTitle>
            <CardDescription>
              {isAdding ? 'Enter the details for the new address.' : 'Update the address details.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(isAdding ? handleAddressCreate : handleAddressUpdate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Address Nickname" {...field} />
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
                        <Input placeholder="Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {useGoogleAutocomplete && (
                  <FormField
                    control={form.control}
                    name="street1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {!useGoogleAutocomplete && (
                  <FormField
                    control={form.control}
                    name="street1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="street2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apt, Suite, Bldg. (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartment, Suite, Building" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
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
                          <Input placeholder="State" {...field} />
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
                          <Input placeholder="Zip Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Country" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CardFooter className="flex justify-between">
                  <Button type="submit" disabled={isCreatingOrUpdating}>
                    {isCreatingOrUpdating ? 'Saving...' : 'Save Address'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      if (isAdding) {
                        setIsAdding(false);
                      } else if (isEditing) {
                        handleCancelEdit();
                      }
                      form.reset();
                    }}
                    disabled={isCreatingOrUpdating}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressSelector;

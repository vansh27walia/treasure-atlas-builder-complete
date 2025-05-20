
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit, Trash2, Check, Home } from 'lucide-react';
import { loadGoogleMapsAPI, initAddressAutocomplete, extractAddressComponents } from '@/utils/addressUtils';
import { PickupAddress, pickupAddressService } from '@/services/PickupAddressService';

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
  phone: z.string().optional(),
  is_default_from: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const AddressSettingsPage = () => {
  const [addresses, setAddresses] = useState<PickupAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const navigate = useNavigate();
  const streetInputRef = React.useRef<HTMLInputElement>(null);
  
  // Initialize the form
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      is_default_from: false,
    }
  });
  
  // Load saved addresses
  const loadAddresses = async () => {
    try {
      const savedAddresses = await pickupAddressService.getSavedAddresses();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };
  
  useEffect(() => {
    loadAddresses();
    
    // Initialize Google Places API for address autocomplete
    const initGooglePlaces = async () => {
      try {
        const loaded = await loadGoogleMapsAPI();
        
        if (loaded && streetInputRef.current) {
          initAddressAutocomplete(streetInputRef.current, (place) => {
            if (place && place.address_components) {
              const components = extractAddressComponents(place);
              
              // Update form with extracted address components
              form.setValue('street1', components.street1 || '');
              form.setValue('city', components.city || '');
              form.setValue('state', components.state || '');
              form.setValue('zip', components.zip || '');
              form.setValue('country', components.country || 'US');
              
              // Trigger validation
              form.trigger(['street1', 'city', 'state', 'zip', 'country']);
              
              toast.success('Address found and auto-filled');
            }
          });
        }
      } catch (error) {
        console.error('Error initializing Google Places:', error);
      }
    };
    
    // Initialize after a short delay
    const timer = setTimeout(() => {
      initGooglePlaces();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [form]);
  
  // Set form values when editing an address
  useEffect(() => {
    if (editingAddressId !== null) {
      const addressToEdit = addresses.find(a => a.id === editingAddressId);
      if (addressToEdit) {
        form.reset({
          name: addressToEdit.name,
          company: addressToEdit.company || '',
          street1: addressToEdit.street1,
          street2: addressToEdit.street2 || '',
          city: addressToEdit.city,
          state: addressToEdit.state,
          zip: addressToEdit.zip,
          country: addressToEdit.country,
          phone: addressToEdit.phone || '',
          is_default_from: addressToEdit.is_default_from,
        });
      }
    } else {
      // Reset form when not editing
      form.reset({
        name: '',
        company: '',
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: '',
        is_default_from: false,
      });
    }
  }, [editingAddressId, addresses, form]);
  
  // Handle form submission
  const onSubmit = async (values: AddressFormValues) => {
    setIsLoading(true);
    
    try {
      if (editingAddressId !== null) {
        // Update existing address
        const updated = await pickupAddressService.updateAddress(editingAddressId, values);
        
        if (updated) {
          toast.success('Pickup address updated successfully');
          setEditingAddressId(null); // Exit edit mode
          loadAddresses(); // Refresh the list
        }
      } else {
        // Create new address
        const created = await pickupAddressService.createAddress(values);
        
        if (created) {
          toast.success('Pickup address added successfully');
          form.reset(); // Clear the form
          loadAddresses(); // Refresh the list
        }
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save pickup address');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this pickup address?')) {
      try {
        const success = await pickupAddressService.deleteAddress(id);
        
        if (success) {
          toast.success('Pickup address deleted successfully');
          loadAddresses(); // Refresh the list
          
          // If we're editing the address that was deleted, reset
          if (editingAddressId === id) {
            setEditingAddressId(null);
          }
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete pickup address');
      }
    }
  };
  
  const handleSetDefault = async (id: number) => {
    try {
      const success = await pickupAddressService.setDefaultAddress(id);
      
      if (success) {
        toast.success('Default pickup address updated');
        loadAddresses(); // Refresh the list
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default pickup address');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Pickup Addresses</h1>
        <Button variant="outline" onClick={() => navigate('/bulk-upload')}>
          Back to Bulk Upload
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Saved Pickup Addresses</CardTitle>
              <CardDescription>
                Your saved pickup addresses will be available during shipping and bulk uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <MapPin className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-600">No saved pickup addresses</h3>
                  <p className="text-gray-500 mt-1 mb-4">Add your first pickup address below</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {addresses.map((address) => (
                    <Card key={address.id} className={`border ${address.is_default_from ? 'border-green-500' : 'border-gray-200'}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <h3 className="font-semibold">{address.name || 'Unnamed Address'}</h3>
                              {address.is_default_from && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            {address.company && <p className="text-sm text-gray-600">{address.company}</p>}
                            <p className="text-sm">{address.street1}</p>
                            {address.street2 && <p className="text-sm">{address.street2}</p>}
                            <p className="text-sm">
                              {address.city}, {address.state} {address.zip}
                            </p>
                            <p className="text-sm">{address.country}</p>
                            {address.phone && <p className="text-sm text-gray-600">{address.phone}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAddressId(address.id)}
                              className="h-8 w-8 p-0 rounded-full"
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(address.id!)}
                              className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                            
                            {!address.is_default_from && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefault(address.id!)}
                                className="h-8 w-8 p-0 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                                <span className="sr-only">Set as default</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{editingAddressId !== null ? 'Edit Pickup Address' : 'Add New Pickup Address'}</CardTitle>
              <CardDescription>
                {editingAddressId !== null ? 'Update your pickup address details' : 'Add a new pickup location for shipping'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Home, Office, Warehouse, etc." {...field} />
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
                            <Input placeholder="Your company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="street1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your street address" 
                            {...field} 
                            ref={streetInputRef} 
                            className="border-blue-300 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormDescription className="text-blue-600 text-xs">
                          Start typing for address suggestions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="street2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment, Suite, Unit, etc. (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Apt #, Suite #, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
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
                          <FormLabel>State / Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State / Province" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP / Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="ZIP / Postal Code" {...field} />
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
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="is_default_from"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Set as default pickup address</FormLabel>
                          <FormDescription>
                            This address will be automatically selected when creating new shipments
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-2">
                    {editingAddressId !== null && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setEditingAddressId(null)}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingAddressId !== null ? 'Save Changes' : 'Add Address'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Help & Information</CardTitle>
              <CardDescription>Tips for adding pickup addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Address Autocomplete</h3>
                <p className="text-sm text-blue-700">
                  Start typing your address in the Street Address field to get suggestions powered by Google Maps.
                </p>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">About Pickup Addresses</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Default Address:</strong> Set your primary pickup address that will be automatically selected for shipments
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Multiple Locations:</strong> Add as many pickup addresses as you need for different shipping scenarios
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Bulk Shipping:</strong> Your saved addresses will be available during the bulk uploading process
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddressSettingsPage;

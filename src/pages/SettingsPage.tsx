
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface AddressFormValues {
  name: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  is_default_from: boolean;
}

const SettingsPage: React.FC = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const navigate = useNavigate();
  
  const form = useForm<AddressFormValues>({
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
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load saved addresses');
    }
  };
  
  useEffect(() => {
    loadAddresses();
  }, []);
  
  // Reset form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      form.reset({
        name: editingAddress.name || '',
        company: editingAddress.company || '',
        street1: editingAddress.street1,
        street2: editingAddress.street2 || '',
        city: editingAddress.city,
        state: editingAddress.state,
        zip: editingAddress.zip,
        country: editingAddress.country || 'US',
        phone: editingAddress.phone || '',
        is_default_from: editingAddress.is_default_from,
      });
    } else {
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
  }, [editingAddress, form]);
  
  const handleSubmit = async (values: AddressFormValues) => {
    setIsLoading(true);
    
    try {
      // Create a new address object
      const addressData = {
        ...values,
        is_default_to: false, // We're only managing pickup (from) addresses in this page
      };
      
      let newAddress;
      
      if (editingAddress) {
        // Update existing address
        await addressService.updateAddress(editingAddress.id, addressData);
        
        if (values.is_default_from) {
          await addressService.setDefaultFromAddress(editingAddress.id);
        }
        
        toast.success('Pickup location updated successfully');
        // Reset editing state
        setEditingAddress(null);
      } else {
        // Create new address
        newAddress = await addressService.createAddress(addressData);
        
        if (newAddress) {
          if (values.is_default_from) {
            await addressService.setDefaultFromAddress(newAddress.id);
          }
          
          toast.success('Pickup location added successfully');
        }
      }
      
      loadAddresses(); // Refresh the address list
      form.reset(); // Clear the form
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save pickup location');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (addressId: number) => {
    if (confirm('Are you sure you want to delete this pickup location?')) {
      try {
        const success = await addressService.deleteAddress(addressId);
        
        if (success) {
          toast.success('Pickup location deleted successfully');
          loadAddresses(); // Refresh the address list
          
          // If we're editing the address that was deleted, reset the form
          if (editingAddress && editingAddress.id === addressId) {
            setEditingAddress(null);
          }
        }
      } catch (error) {
        console.error('Error deleting address:', error);
        toast.error('Failed to delete pickup location');
      }
    }
  };
  
  const handleSetDefault = async (addressId: number) => {
    try {
      const success = await addressService.setDefaultFromAddress(addressId);
      
      if (success) {
        toast.success('Default pickup location updated');
        loadAddresses(); // Refresh the address list
      }
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default pickup location');
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
          
          <Tabs defaultValue="locations" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Locations
              </TabsTrigger>
              <TabsTrigger value="account" disabled className="flex items-center gap-2">
                Account
              </TabsTrigger>
              <TabsTrigger value="preferences" disabled className="flex items-center gap-2">
                Preferences
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="locations">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Manage Pickup Locations</CardTitle>
                  <CardDescription>
                    Add, edit, or delete your saved pickup locations for faster shipment creation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {addresses.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-md">
                        <MapPin className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <h3 className="text-lg font-medium text-gray-600">No saved pickup locations</h3>
                        <p className="text-gray-500 mt-1 mb-4">Add your first pickup location below</p>
                      </div>
                    ) : (
                      addresses.map((address) => (
                        <Card key={address.id} className={`border ${address.is_default_from ? 'border-green-500' : 'border-gray-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{address.name || 'Unnamed Location'}</h3>
                                  {address.is_default_from && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                {address.company && <p className="text-gray-600">{address.company}</p>}
                                <p>{address.street1}</p>
                                {address.street2 && <p>{address.street2}</p>}
                                <p>
                                  {address.city}, {address.state} {address.zip}
                                </p>
                                <p>{address.country}</p>
                                {address.phone && <p className="text-gray-600">{address.phone}</p>}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingAddress(address)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(address.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {!address.is_default_from && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSetDefault(address.id)}
                                    className="text-green-600 hover:text-green-800 hover:bg-green-50"
                                    title="Set as default"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{editingAddress ? 'Edit Pickup Location' : 'Add New Pickup Location'}</CardTitle>
                  <CardDescription>
                    {editingAddress 
                      ? 'Update your pickup location details' 
                      : 'Enter the details for a new pickup location'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Home, Office, etc." {...field} />
                              </FormControl>
                              <FormDescription>
                                A name to help you identify this location
                              </FormDescription>
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
                                <Input placeholder="Company name" {...field} />
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
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="Street address" required {...field} />
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
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} />
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
                                <Input placeholder="City" required {...field} />
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
                                <Input placeholder="State" required {...field} />
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
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input placeholder="ZIP code" required {...field} />
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
                                <Input placeholder="Country" required {...field} />
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
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="is_default_from"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Default Settings</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => field.onChange(e.target.checked)}
                                  id="is_default_from"
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_default_from" className="text-sm text-gray-700">
                                  Set as default pickup location
                                </label>
                              </div>
                            </FormControl>
                            <FormDescription>
                              This address will be automatically selected when creating new shipments
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between">
                        {editingAddress ? (
                          <>
                            <Button type="button" variant="outline" onClick={() => setEditingAddress(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Saving...' : 'Update Location'}
                            </Button>
                          </>
                        ) : (
                          <Button type="submit" className="ml-auto" disabled={isLoading}>
                            {isLoading ? 'Adding...' : 'Add Location'}
                          </Button>
                        )}
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="w-full md:w-1/3 md:sticky md:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Help & Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Why save pickup locations?</h3>
                <p className="text-sm text-gray-600">
                  Saved locations make it faster to create shipping labels and schedule pickups.
                  Your default location will be automatically selected when creating shipments.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Address validation</h3>
                <p className="text-sm text-gray-600">
                  For the best shipping rates and delivery times, ensure your addresses are complete
                  and formatted correctly.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold mb-1">Default pickup location</h3>
                <p className="text-sm text-gray-600">
                  Your default pickup location will automatically be used for new shipments.
                  You can change your default location at any time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

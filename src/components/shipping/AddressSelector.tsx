
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService, SavedAddress } from '@/services/AddressService';
import { userProfileService } from '@/services/UserProfileService';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Settings, Edit, Save, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { COUNTRIES_LIST } from '@/lib/countries';

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  is_default_from: z.boolean().default(false),
  is_default_to: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect: (address: SavedAddress) => void;
  selectedAddressId?: number;
  allowAddNew?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type, 
  onAddressSelect,
  selectedAddressId,
  allowAddNew = true
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultAddressId, setDefaultAddressId] = useState<number | null>(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(type === 'to'); // For destination address
  const navigate = useNavigate();
  
  // Form for adding/editing addresses
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
      is_default_from: type === 'from',
      is_default_to: type === 'to',
    }
  });
  
  // Form for inline address (for destination popup)
  const inlineForm = useForm<AddressFormValues>({
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
      is_default_from: type === 'from',
      is_default_to: type === 'to',
    }
  });
  
  // Load saved addresses and default address from user profile
  const loadAddressData = async () => {
    setIsLoading(true);
    try {
      // Load all saved addresses
      const savedAddresses = await addressService.getSavedAddresses();
      setAddresses(savedAddresses);
      
      // Get the user profile to check for default pickup address
      if (type === 'from') {
        const userProfile = await userProfileService.getUserProfile();
        if (userProfile?.default_pickup_address_id) {
          setDefaultAddressId(userProfile.default_pickup_address_id);
        }
      }
      
      // Select default address if no address is already selected
      if (!selectedAddressId && savedAddresses.length > 0) {
        let addressToSelect: SavedAddress | undefined;
        
        if (type === 'from') {
          // First try the default from user profile
          if (defaultAddressId) {
            addressToSelect = savedAddresses.find(addr => addr.id === defaultAddressId);
          }
          
          // Then try default_from flag
          if (!addressToSelect) {
            addressToSelect = savedAddresses.find(addr => addr.is_default_from);
          }
        } else {
          // For 'to' addresses, check for default_to flag
          addressToSelect = savedAddresses.find(addr => addr.is_default_to);
        }
        
        // If still no address found, use the first one
        if (!addressToSelect && savedAddresses.length > 0) {
          addressToSelect = savedAddresses[0];
        }
        
        if (addressToSelect) {
          onAddressSelect(addressToSelect);
          
          // If this is a destination address, populate the inline form
          if (type === 'to') {
            inlineForm.reset({
              name: addressToSelect.name || '',
              company: addressToSelect.company || '',
              street1: addressToSelect.street1,
              street2: addressToSelect.street2 || '',
              city: addressToSelect.city,
              state: addressToSelect.state,
              zip: addressToSelect.zip,
              country: addressToSelect.country,
              phone: addressToSelect.phone || '',
              is_default_from: addressToSelect.is_default_from,
              is_default_to: addressToSelect.is_default_to,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error("Failed to load saved addresses");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadAddressData();
  }, [type, selectedAddressId]);
  
  const handleAddressChange = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.id === parseInt(addressId));
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
      
      // If destination address, populate the inline form
      if (type === 'to') {
        inlineForm.reset({
          name: selectedAddress.name || '',
          company: selectedAddress.company || '',
          street1: selectedAddress.street1,
          street2: selectedAddress.street2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
          phone: selectedAddress.phone || '',
          is_default_from: selectedAddress.is_default_from,
          is_default_to: selectedAddress.is_default_to,
        });
      }
    }
  };
  
  const formatAddressForDisplay = (address: SavedAddress) => {
    const name = address.name || 'Unnamed Location';
    return `${name} - ${address.city}, ${address.state}`;
  };
  
  const goToAddressSettings = () => {
    navigate('/settings');
  };
  
  const openAddNewAddressDialog = () => {
    setEditingAddress(null);
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
      is_default_from: type === 'from',
      is_default_to: type === 'to',
    });
    setShowAddressDialog(true);
  };
  
  const openEditAddressDialog = (address: SavedAddress) => {
    setEditingAddress(address);
    form.reset({
      name: address.name || '',
      company: address.company || '',
      street1: address.street1,
      street2: address.street2 || '',
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      phone: address.phone || '',
      is_default_from: address.is_default_from,
      is_default_to: address.is_default_to,
    });
    setShowAddressDialog(true);
  };
  
  // Function to open the destination address form popup
  const openAddressFormPopup = () => {
    inlineForm.reset({
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
      is_default_to: true,
    });
    setShowAddressForm(true);
  };
  
  // Handle saving an address (both from dialog and inline form)
  const handleSaveAddress = async (values: AddressFormValues) => {
    try {
      // Create a properly typed addressData object with required fields
      const addressData: Omit<SavedAddress, "created_at" | "id" | "user_id"> = {
        name: values.name,
        company: values.company || '',
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        phone: values.phone || '',
        is_default_from: values.is_default_from,
        is_default_to: values.is_default_to,
      };
      
      if (editingAddress) {
        // Update existing address
        const updatedAddress = await addressService.updateAddress(editingAddress.id, addressData);
        if (updatedAddress) {
          // If this is set as default address, update the user profile
          if (type === 'from' && values.is_default_from) {
            await userProfileService.updateDefaultPickupAddressId(updatedAddress.id);
            await addressService.setDefaultFromAddress(updatedAddress.id);
          }
          
          if (type === 'to' && values.is_default_to) {
            await addressService.setDefaultToAddress(updatedAddress.id);
          }
          
          toast.success("Address updated successfully");
          onAddressSelect(updatedAddress);
        }
      } else {
        // Create new address
        const newAddress = await addressService.createAddress(addressData);
        if (newAddress) {
          // If this is set as default address, update the user profile
          if (type === 'from' && values.is_default_from) {
            await userProfileService.updateDefaultPickupAddressId(newAddress.id);
            await addressService.setDefaultFromAddress(newAddress.id);
          }
          
          if (type === 'to' && values.is_default_to) {
            await addressService.setDefaultToAddress(newAddress.id);
          }
          
          toast.success("Address saved successfully");
          onAddressSelect(newAddress);
        }
      }
      
      // Close dialog and reload addresses
      setShowAddressDialog(false);
      loadAddressData();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error("Failed to save address");
    }
  };
  
  // Handle saving the inline form as a new address
  const handleSaveInlineForm = async () => {
    try {
      const formValues = inlineForm.getValues();
      
      // Create a properly typed addressData object with required fields
      const addressData: Omit<SavedAddress, "created_at" | "id" | "user_id"> = {
        name: formValues.name,
        company: formValues.company || '',
        street1: formValues.street1,
        street2: formValues.street2 || '',
        city: formValues.city,
        state: formValues.state,
        zip: formValues.zip,
        country: formValues.country,
        phone: formValues.phone || '',
        is_default_from: false,
        is_default_to: formValues.is_default_to,
      };
      
      // Create new address
      const newAddress = await addressService.createAddress(addressData);
      if (newAddress) {
        // If this is set as default address, update settings
        if (formValues.is_default_to) {
          await addressService.setDefaultToAddress(newAddress.id);
        }
        
        toast.success("Destination address saved successfully");
        onAddressSelect(newAddress);
        setShowAddressForm(false);
        
        // Reload the addresses list
        loadAddressData();
      }
    } catch (error) {
      console.error('Error saving inline address form:', error);
      toast.error("Failed to save destination address");
    }
  };
  
  // Submit handler for the popup form
  const handleSubmitPopupForm = inlineForm.handleSubmit(handleSaveInlineForm);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {type === 'from' ? 'Pickup' : 'Delivery'} Address
        </h3>
        
        <div className="flex items-center gap-2">
          {allowAddNew && type === 'from' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={openAddNewAddressDialog}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add New
            </Button>
          )}
          
          {type === 'from' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={goToAddressSettings}
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Manage
            </Button>
          )}
          
          {type === 'to' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={openAddressFormPopup}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Enter Manually
            </Button>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading addresses..." />
          </SelectTrigger>
        </Select>
      ) : addresses.length === 0 ? (
        <div className="text-sm text-gray-500 flex items-center justify-between bg-gray-50 border rounded-md p-3">
          <span>No saved addresses</span>
          {type === 'from' ? (
            <Button size="sm" variant="default" onClick={openAddNewAddressDialog}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Address
            </Button>
          ) : (
            <Button size="sm" variant="default" onClick={openAddressFormPopup}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Address
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Select 
            value={selectedAddressId?.toString()} 
            onValueChange={handleAddressChange}
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
          
          {selectedAddressId && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-1"
              onClick={() => {
                const address = addresses.find(addr => addr.id === selectedAddressId);
                if (address) {
                  openEditAddressDialog(address);
                }
              }}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit this address
            </Button>
          )}
        </div>
      )}
      
      {/* Address Dialog for adding/editing addresses */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveAddress)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label/Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Home, Office, etc." {...field} />
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
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
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
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
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
                      <FormLabel>Apartment, Suite, etc. (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, Suite, Unit, etc." {...field} />
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
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State/Province" {...field} />
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
                        <FormLabel>ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP/Postal Code" {...field} />
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
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRIES_LIST.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {type === 'from' && (
                  <FormField
                    control={form.control}
                    name="is_default_from"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Set as default pickup address</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {type === 'to' && (
                  <FormField
                    control={form.control}
                    name="is_default_to"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Set as default delivery address</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddressDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Address</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Popup form dialog for destination address */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Enter Delivery Address
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <Form {...inlineForm}>
            <form onSubmit={handleSubmitPopupForm} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={inlineForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Label/Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Home, Office, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inlineForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inlineForm.control}
                  name="street1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inlineForm.control}
                  name="street2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment, Suite, etc. (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, Suite, Unit, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inlineForm.control}
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
                    control={inlineForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State/Province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inlineForm.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP/Postal Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={inlineForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {COUNTRIES_LIST.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={inlineForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={inlineForm.control}
                  name="is_default_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">Set as default delivery address</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Address</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddressSelector;

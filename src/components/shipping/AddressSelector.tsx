import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { COUNTRIES_LIST } from '@/lib/countries';
import { Phone, MapPin, Edit2 } from 'lucide-react';
import { extractAddressComponents } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';
import { SavedAddress } from '@/services/AddressService';
import AddressAutoComplete from './AddressAutoComplete';
import SelectAddressDropdown from './SelectAddressDropdown';

// Create a simplified address type that matches the form inputs
export interface SimpleAddress {
  name?: string;
  company?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}
const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP/Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional()
});
type AddressFormValues = z.infer<typeof addressSchema>;
interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect?: (address: SimpleAddress) => void;
  selectedAddressId?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
  useGoogleAutocomplete?: boolean;
  defaultAddress?: SavedAddress | null;
}
const AddressSelector: React.FC<AddressSelectorProps> = ({
  type,
  onAddressSelect,
  selectedAddressId,
  inputRef,
  useGoogleAutocomplete = true,
  defaultAddress
}) => {
  const streetInputRef = useRef<HTMLInputElement>(null);
  const combinedRef = inputRef || streetInputRef;
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<SavedAddress | null>(defaultAddress || null);
  const [showAddressForm, setShowAddressForm] = useState(!defaultAddress);
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
      phone: ''
    }
  });

  // Update form values when a saved address is selected
  useEffect(() => {
    if (selectedSavedAddress) {
      console.log("Setting form values from saved address:", selectedSavedAddress);
      form.setValue('name', selectedSavedAddress.name || '', {
        shouldValidate: true
      });
      form.setValue('company', selectedSavedAddress.company || '', {
        shouldValidate: true
      });
      form.setValue('street1', selectedSavedAddress.street1, {
        shouldValidate: true
      });
      form.setValue('street2', selectedSavedAddress.street2 || '', {
        shouldValidate: true
      });
      form.setValue('city', selectedSavedAddress.city, {
        shouldValidate: true
      });
      form.setValue('state', selectedSavedAddress.state, {
        shouldValidate: true
      });
      form.setValue('zip', selectedSavedAddress.zip, {
        shouldValidate: true
      });
      form.setValue('country', selectedSavedAddress.country, {
        shouldValidate: true
      });
      form.setValue('phone', selectedSavedAddress.phone || '', {
        shouldValidate: true
      });

      // Submit form values
      if (onAddressSelect) {
        onAddressSelect(selectedSavedAddress);
      }
    }
  }, [selectedSavedAddress, form, onAddressSelect]);

  // Auto-submit form when all required fields are filled
  const watchRequired = form.watch(['name', 'street1', 'city', 'state', 'zip']);
  useEffect(() => {
    const allFilled = watchRequired.every(field => field && field.trim() !== '');
    if (allFilled) {
      const values = form.getValues();
      if (onAddressSelect) {
        onAddressSelect(values);
      }
    }
  }, [watchRequired, form, onAddressSelect]);
  const handleGooglePlaceSelected = useCallback((place: GoogleMapsPlace) => {
    console.log("Google place selected in AddressSelector:", place);
    if (place) {
      const addressComponents = extractAddressComponents(place);
      console.log("Extracted address components:", addressComponents);

      // Update form values with extracted address components
      if (addressComponents.street1) {
        form.setValue('street1', addressComponents.street1, {
          shouldValidate: true
        });
      }
      if (addressComponents.city) {
        form.setValue('city', addressComponents.city, {
          shouldValidate: true
        });
      }
      if (addressComponents.state) {
        form.setValue('state', addressComponents.state, {
          shouldValidate: true
        });
      }
      if (addressComponents.zip) {
        form.setValue('zip', addressComponents.zip, {
          shouldValidate: true
        });
      }
      if (addressComponents.country) {
        form.setValue('country', addressComponents.country, {
          shouldValidate: true
        });
      }

      // Trigger form validation
      form.trigger(['street1', 'city', 'state', 'zip', 'country']);
      toast.success('Address found and auto-filled');
    }
  }, [form]);

  // Handle direct address line changes
  const handleAddressLineChange = useCallback((value: string) => {
    form.setValue('street1', value, {
      shouldValidate: true
    });
  }, [form]);

  // Handle selecting a saved address
  const handleSavedAddressSelected = useCallback((address: SavedAddress | null) => {
    console.log("Saved address selected:", address);
    setSelectedSavedAddress(address);
    setShowAddressForm(!address); // Show form if no address is selected
  }, []);

  // Handle adding a new address
  const handleAddNewAddress = useCallback(() => {
    setSelectedSavedAddress(null);
    setShowAddressForm(true);
    form.reset(); // Clear the form
  }, [form]);

  // Handle editing existing address
  const handleEditAddress = useCallback(() => {
    setShowAddressForm(true);
  }, []);
  return <div className="space-y-4">
      
      
      {showAddressForm && <Card className="border border-gray-100 shadow-sm">
          <CardContent className="pt-3">
            <Form {...form}>
              <form className="space-y-3">
                <FormField control={form.control} name="name" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-sm">Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="company" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-sm">Company (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="street1" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-sm">Street Address</FormLabel>
                      <FormControl>
                        <AddressAutoComplete placeholder="Start typing your address..." defaultValue={field.value} onAddressSelected={handleGooglePlaceSelected} onChange={handleAddressLineChange} id="address-line-1" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="street2" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-sm">Apartment, Suite, etc. (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt, Suite, Unit, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="city" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="state" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State/Province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="zip" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">ZIP/Postal Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP/Postal Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={form.control} name="country" render={({
                field
              }) => <FormItem>
                        <FormLabel className="text-sm">Country</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] bg-white z-50">
                            {COUNTRIES_LIST.map(country => <SelectItem key={country.code} value={country.code}>
                                {country.name}
                              </SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />
                </div>
                
                <FormField control={form.control} name="phone" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-sm">Phone</FormLabel>
                      <div className="flex items-center">
                        <div className="bg-gray-100 p-2 border border-gray-300 rounded-l-md">
                          <Phone className="h-4 w-4 text-gray-500" />
                        </div>
                        <FormControl>
                          <Input placeholder="Contact phone number" className="rounded-l-none" {...field} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>} />
              </form>
            </Form>
          </CardContent>
        </Card>}
      
      {!showAddressForm && selectedSavedAddress && <Card className="border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 gap-1 text-sm flex-1">
              <p className="font-medium">{selectedSavedAddress.name || 'Unnamed Address'}</p>
              {selectedSavedAddress.company && <p>{selectedSavedAddress.company}</p>}
              <p>{selectedSavedAddress.street1}</p>
              {selectedSavedAddress.street2 && <p>{selectedSavedAddress.street2}</p>}
              <p>{selectedSavedAddress.city}, {selectedSavedAddress.state} {selectedSavedAddress.zip}</p>
              <p>{selectedSavedAddress.country}</p>
              {selectedSavedAddress.phone && <p>Phone: {selectedSavedAddress.phone}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={handleEditAddress} className="ml-2">
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>}
    </div>;
};
export default AddressSelector;
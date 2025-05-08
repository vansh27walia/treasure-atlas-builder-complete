
import React, { useState } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { COUNTRIES_LIST } from '@/lib/countries';
import { Phone, MapPin } from 'lucide-react';

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
  phone: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressSelectorProps {
  type: 'from' | 'to';
  onAddressSelect?: (address: SimpleAddress) => void;
  selectedAddressId?: number;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type,
  onAddressSelect,
  selectedAddressId
}) => {
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
    }
  });
  
  // Auto-submit form when all required fields are filled
  const watchRequired = form.watch(['name', 'street1', 'city', 'state', 'zip']);
  
  React.useEffect(() => {
    const allFilled = watchRequired.every(field => field && field.trim() !== '');
    if (allFilled) {
      const values = form.getValues();
      if (onAddressSelect) {
        onAddressSelect(values);
      }
    }
  }, [watchRequired, form, onAddressSelect]);
  
  const handleSubmit = (values: AddressFormValues) => {
    if (onAddressSelect) {
      onAddressSelect(values);
    }
  };
  
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="pt-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {type === 'from' ? 'Pickup Location' : 'Delivery Location'}
                </span>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
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
                    <FormLabel className="text-sm">Company (optional)</FormLabel>
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
                    <FormLabel className="text-sm">Street Address</FormLabel>
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
                    <FormLabel className="text-sm">Apartment, Suite, etc. (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Apt, Suite, Unit, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">City</FormLabel>
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
                      <FormLabel className="text-sm">State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State/Province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">ZIP/Postal Code</FormLabel>
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
                      <FormLabel className="text-sm">Country</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
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
                    <FormLabel className="text-sm">Phone</FormLabel>
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-2 border border-gray-300 rounded-l-md">
                        <Phone className="h-4 w-4 text-gray-500" />
                      </div>
                      <FormControl>
                        <Input 
                          placeholder="Contact phone number" 
                          className="rounded-l-none" 
                          {...field} 
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddressSelector;


import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { COUNTRIES_LIST } from '@/lib/countries';
import { Phone, MapPin } from 'lucide-react';
import { loadGoogleMapsAPI, initAddressAutocomplete, extractAddressComponents } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';

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
  type?: 'from' | 'to';
  form?: UseFormReturn<any, any, any>; // Add the form prop to the interface
  prefix?: string; // Add the prefix prop to the interface
  onAddressSelect?: (address: SimpleAddress) => void;
  selectedAddressId?: number;
  inputRef?: React.RefObject<HTMLInputElement>;
  useGoogleAutocomplete?: boolean;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({ 
  type = 'from', // Provide default value
  form: externalForm, // Rename to avoid naming conflicts
  prefix,
  onAddressSelect,
  selectedAddressId,
  inputRef,
  useGoogleAutocomplete = true // Enable by default
}) => {
  const [googlePlacesEnabled, setGooglePlacesEnabled] = useState(false);
  const streetInputRef = useRef<HTMLInputElement>(null);
  const combinedRef = inputRef || streetInputRef;
  
  // Use the externally provided form if available, otherwise create a new one
  const internalForm = useForm<AddressFormValues>({
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
  
  // Use the external form if provided, otherwise use the internal form
  const form = externalForm || internalForm;
  
  // When using an external form with a prefix, we need to handle field names differently
  const getFieldName = (name: string) => {
    return prefix ? `${prefix}${name.charAt(0).toUpperCase() + name.slice(1)}` : name;
  };
  
  // Auto-submit form when all required fields are filled
  const watchRequired = prefix 
    ? [getFieldName('name'), getFieldName('street1'), getFieldName('city'), getFieldName('state'), getFieldName('zip')].map(field => form.watch(field))
    : form.watch(['name', 'street1', 'city', 'state', 'zip']);
  
  useEffect(() => {
    if (!onAddressSelect) return;
    
    const allFilled = watchRequired.every(field => field && field.trim() !== '');
    if (allFilled) {
      const values = prefix 
        ? {
            name: form.getValues(getFieldName('name')),
            company: form.getValues(getFieldName('company')),
            street1: form.getValues(getFieldName('street1')),
            street2: form.getValues(getFieldName('street2')),
            city: form.getValues(getFieldName('city')),
            state: form.getValues(getFieldName('state')),
            zip: form.getValues(getFieldName('zip')),
            country: form.getValues(getFieldName('country')),
            phone: form.getValues(getFieldName('phone')),
          }
        : form.getValues();
        
      onAddressSelect(values);
    }
  }, [watchRequired, form, onAddressSelect, prefix]);
  
  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = async () => {
      try {
        if (!useGoogleAutocomplete) return;
        
        const loaded = await loadGoogleMapsAPI();
        setGooglePlacesEnabled(loaded);
        
        if (loaded) {
          console.log('Google Places API loaded successfully, initializing autocomplete');
          
          if (combinedRef.current) {
            // Initialize autocomplete on street1 input
            initAddressAutocomplete(combinedRef.current, (place) => {
              if (place && place.address_components) {
                const addressComponents = extractAddressComponents(place);
                
                // Update form values with extracted address components
                form.setValue('street1', addressComponents.street1 || '');
                form.setValue('city', addressComponents.city || '');
                form.setValue('state', addressComponents.state || '');
                form.setValue('zip', addressComponents.zip || '');
                form.setValue('country', addressComponents.country || 'US');
                
                // Trigger form validation
                form.trigger(['street1', 'city', 'state', 'zip', 'country']);
                
                toast.success('Address found and auto-filled');
              }
            });
          } else {
            console.warn('Input reference not available for autocomplete');
          }
        } else {
          console.warn('Google Places API could not be loaded');
        }
      } catch (error) {
        console.error('Error initializing Google Places:', error);
        setGooglePlacesEnabled(false);
      }
    };
    
    // Initialize Google Places after a short delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      initGooglePlaces();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [form, useGoogleAutocomplete, combinedRef]);
  
  const handleSubmit = (values: AddressFormValues) => {
    if (onAddressSelect) {
      onAddressSelect(values);
    }
  };
  
  // Handle special case for external form with prefix
  if (externalForm && prefix) {
    return (
      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {type === 'from' ? 'Pickup Location' : 'Delivery Location'}
              </span>
            </div>

            <FormField
              control={form.control}
              name={getFieldName('name')}
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
              name={getFieldName('company')}
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
              name={getFieldName('street1')}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Street Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={googlePlacesEnabled ? "Start typing your address..." : "Street address"} 
                      {...field}
                      ref={combinedRef}
                      className={googlePlacesEnabled ? "border-blue-300 focus:border-blue-500" : ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={getFieldName('street2')}
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
                name={getFieldName('city')}
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
                name={getFieldName('state')}
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
                name={getFieldName('zip')}
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
                name={getFieldName('country')}
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
              name={getFieldName('phone')}
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
        </CardContent>
      </Card>
    );
  }
  
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
                      <Input 
                        placeholder={googlePlacesEnabled ? "Start typing your address..." : "Street address"} 
                        {...field}
                        ref={combinedRef}
                        className={googlePlacesEnabled ? "border-blue-300 focus:border-blue-500" : ""}
                      />
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

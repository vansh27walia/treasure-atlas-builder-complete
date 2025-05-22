
import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { SavedAddress } from '@/services/AddressService';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import AddressAutoComplete from './AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

const addressSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  street1: z.string().min(1, 'Address line 1 is required'),
  street2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  phone: z.string().optional(),
  is_default_from: z.boolean().default(false),
  is_default_to: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (values: AddressFormValues) => void;
  isLoading?: boolean;
  buttonText?: string;
  showDefaultOptions?: boolean;
  isPickupAddress?: boolean;
}

const AddressForm: React.FC<AddressFormProps> = ({
  defaultValues = {},
  onSubmit,
  isLoading = false,
  buttonText = 'Save Address',
  showDefaultOptions = true,
  isPickupAddress = true,
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
      is_default_from: false,
      is_default_to: false,
      ...defaultValues,
    },
  });

  // When defaultValues change, update form values
  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      Object.entries(defaultValues).forEach(([key, value]) => {
        form.setValue(key as any, value);
      });
    }
  }, [defaultValues, form]);

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    const { street1, city, state, zip, country } = extractAddressComponents(place);
    
    form.setValue('street1', street1, { shouldValidate: true });
    form.setValue('city', city, { shouldValidate: true });
    form.setValue('state', state, { shouldValidate: true });
    form.setValue('zip', zip, { shouldValidate: true });
    form.setValue('country', country, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Name</FormLabel>
                <FormControl>
                  <Input placeholder="Home, Office, etc." {...field} value={field.value || ''} />
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
                  <Input placeholder="Company name" {...field} value={field.value || ''} />
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <AddressAutoComplete 
                  placeholder="Enter your address"
                  defaultValue={field.value}
                  onAddressSelected={handleGooglePlaceSelected}
                  id="address-autocomplete"
                  required
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
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} value={field.value || ''} />
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
                  <Input placeholder="City" required {...field} value={field.value || ''} />
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
                  <Input placeholder="State" required {...field} value={field.value || ''} />
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
                  <Input placeholder="ZIP code" required {...field} value={field.value || ''} />
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
                  <Input placeholder="Country" required {...field} value={field.value || ''} />
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
                <Input placeholder="Phone number" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {showDefaultOptions && (
          <div className="flex flex-col space-y-2">
            {isPickupAddress && (
              <FormField
                control={form.control}
                name="is_default_from"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default pickup location
                      </FormLabel>
                      <FormDescription>
                        This address will be automatically selected when creating new shipments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            
            {!isPickupAddress && (
              <FormField
                control={form.control}
                name="is_default_to"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Set as default recipient location
                      </FormLabel>
                      <FormDescription>
                        This address will be automatically selected as the recipient when creating new shipments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : buttonText}
        </Button>
      </form>
    </Form>
  );
};

export default AddressForm;

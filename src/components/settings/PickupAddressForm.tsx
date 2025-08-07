
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AddressAutoComplete from '../shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

interface AddressFormValues {
  name: string;
  company: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default_from: boolean;
}

interface PickupAddressFormProps {
  onAddressSaved?: () => void;
}

const PickupAddressForm: React.FC<PickupAddressFormProps> = ({ onAddressSaved }) => {
  const { user } = useAuth();
  const { createAddress, isUpdating } = usePickupAddresses();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddressFormValues>({
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      is_default_from: false,
    }
  });

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in pickup address form:", place);
      
      if (!place) {
        console.warn("No place data received");
        return;
      }
      
      const { street1, city, state, zip, country } = extractAddressComponents(place);
      
      console.log("Extracted components for pickup address form:", { street1, city, state, zip, country });
      
      // Set all the form values at once with proper validation triggers
      if (street1) {
        form.setValue('street1', street1, { shouldValidate: true, shouldDirty: true });
      }
      if (city) {
        form.setValue('city', city, { shouldValidate: true, shouldDirty: true });
      }
      if (state) {
        form.setValue('state', state, { shouldValidate: true, shouldDirty: true });
      }
      if (zip) {
        form.setValue('zip', zip, { shouldValidate: true, shouldDirty: true });
      }
      if (country) {
        form.setValue('country', country, { shouldValidate: true, shouldDirty: true });
      }
      
      toast.success('Address details populated from Google Maps');
    } catch (error) {
      console.error("Error processing Google place selection:", error);
      toast.error('Failed to process selected address');
    }
  };

  const handleAddressLineChange = (value: string) => {
    form.setValue('street1', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: AddressFormValues) => {
    if (!user) {
      toast.error('You need to be logged in to save addresses');
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        name: values.name,
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country,
        company: values.company || '',
        phone: values.phone,
        is_default_from: values.is_default_from,
        is_default_to: false,
      };

      console.log("Submitting pickup address:", addressData);

      const savedAddress = await createAddress(addressData);

      if (savedAddress) {
        toast.success('Pickup address saved successfully!');
        form.reset();
        if (onAddressSaved) {
          onAddressSaved();
        }
      }
    } catch (error) {
      console.error('Error saving pickup address:', error);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Add New Pickup Address</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input required placeholder="First Last Name" {...field} />
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
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input required type="tel" placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Company name (optional)" {...field} />
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
                <FormLabel>Street Address with Google Autocomplete *</FormLabel>
                <FormControl>
                  <AddressAutoComplete 
                    placeholder="Start typing your address..."
                    defaultValue={field.value}
                    onAddressSelected={handleGooglePlaceSelected}
                    onChange={handleAddressLineChange}
                    onFullAddressPopulated={(addressData) => {
                      console.log("Full address populated in pickup form:", addressData);
                      if (addressData.street1) form.setValue('street1', addressData.street1);
                      if (addressData.city) form.setValue('city', addressData.city);
                      if (addressData.state) form.setValue('state', addressData.state);
                      if (addressData.zip) form.setValue('zip', addressData.zip);
                      if (addressData.country) form.setValue('country', addressData.country);
                    }}
                    id="pickup-address-autocomplete"
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
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apartment, suite, etc. (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input required placeholder="City" {...field} />
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
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input required placeholder="State" {...field} />
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
                  <FormLabel>ZIP Code *</FormLabel>
                  <FormControl>
                    <Input required placeholder="ZIP Code" {...field} />
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
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <Input required placeholder="Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_default_from"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Set as default pickup address
                </FormLabel>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting || isUpdating} className="w-full">
            {isSubmitting || isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Pickup Address'
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default PickupAddressForm;

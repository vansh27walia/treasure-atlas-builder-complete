
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { addressService } from '@/services/AddressService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus } from 'lucide-react';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

interface QuickAddFormValues {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

const QuickAddAddressForm: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuickAddFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      isDefault: false,
    }
  });

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in quick add form:", place);
      
      if (!place) {
        console.warn("No place data received");
        return;
      }
      
      const { street1, city, state, zip } = extractAddressComponents(place);
      
      console.log("Extracted components for quick add form:", { street1, city, state, zip });
      
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
      
      toast.success('Address details populated from Google Maps');
    } catch (error) {
      console.error("Error processing Google place selection:", error);
      toast.error('Failed to process selected address');
    }
  };

  const handleAddressLineChange = (value: string) => {
    form.setValue('street1', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: QuickAddFormValues) => {
    if (!user) {
      toast.error('You need to be logged in to save addresses');
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        name: `${values.firstName} ${values.lastName}`,
        street1: values.street1,
        street2: values.street2,
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: 'US',
        company: values.company,
        phone: values.phone,
        is_default_from: values.isDefault,
        is_default_to: false,
      };

      let savedAddress = null;
      
      try {
        savedAddress = await addressService.createAddress(addressData, false);
      } catch (standardError) {
        console.log('Standard create failed, trying with encryption', standardError);
        savedAddress = await addressService.createAddress(addressData, true);
      }

      if (savedAddress) {
        toast.success('Address saved successfully!');
        form.reset();
        // Trigger a page refresh to update address lists
        window.location.reload();
      } else {
        throw new Error('Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="mr-2 h-5 w-5" />
          Quick Add Pickup Address
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input required placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input required placeholder="Last name" {...field} />
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
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
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
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input required type="tel" placeholder="Phone number" {...field} />
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
                  <FormLabel>Street Address with Google Autocomplete</FormLabel>
                  <FormControl>
                    <AddressAutoComplete 
                      placeholder="Start typing your address..."
                      defaultValue={field.value}
                      onAddressSelected={handleGooglePlaceSelected}
                      onChange={handleAddressLineChange}
                      id="quick-add-address-autocomplete"
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
                  <FormLabel>Street Address 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartment, suite, etc." {...field} />
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
                    <FormLabel>City</FormLabel>
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
                    <FormLabel>State</FormLabel>
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
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input required placeholder="ZIP Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Pickup Address'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default QuickAddAddressForm;

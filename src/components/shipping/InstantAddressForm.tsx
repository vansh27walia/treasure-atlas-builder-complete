
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AddressAutoComplete from './AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

interface InstantFormValues {
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  addressType: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

interface InstantAddressFormProps {
  onAddressSaved: (address: SavedAddress) => void;
  isPickupAddress?: boolean;
}

const InstantAddressForm: React.FC<InstantAddressFormProps> = ({
  onAddressSaved,
  isPickupAddress = true
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<InstantFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      phone: '',
      email: '',
      addressType: 'home',
      street1: '',
      city: '',
      state: '',
      zip: '',
      isDefault: false,
    }
  });

  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in instant form:", place);
      
      if (!place) {
        console.warn("No place data received");
        return;
      }
      
      const { street1, city, state, zip } = extractAddressComponents(place);
      
      console.log("Extracted components for instant form:", { street1, city, state, zip });
      
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
      
      toast.success('Address details populated from Google Maps');
    } catch (error) {
      console.error("Error processing Google place selection:", error);
      toast.error('Failed to process selected address');
    }
  };

  const handleAddressLineChange = (value: string) => {
    form.setValue('street1', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: InstantFormValues) => {
    if (!user) {
      toast.error('You need to be logged in to save addresses');
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        name: `${values.firstName} ${values.lastName} - ${values.addressType}`,
        street1: values.street1,
        street2: '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: 'US',
        company: values.company,
        phone: values.phone,
        is_default_from: isPickupAddress && values.isDefault,
        is_default_to: !isPickupAddress && values.isDefault,
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
        onAddressSaved(savedAddress);
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
    <Card className="p-6 bg-blue-50 border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-blue-700">
        Quick Add {isPickupAddress ? 'Pickup' : 'Delivery'} Address
      </h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="addressType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select address type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="delivery-center">Delivery Center</SelectItem>
                    <SelectItem value="retail-store">Retail Store</SelectItem>
                    <SelectItem value="relative-house">Relative's House</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <div className="grid grid-cols-2 gap-4">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input required type="email" placeholder="Email address" {...field} />
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
                <FormLabel>Street Address with Google Autocomplete</FormLabel>
                <FormControl>
                  <AddressAutoComplete 
                    placeholder="Start typing your address..."
                    defaultValue={field.value}
                    onAddressSelected={handleGooglePlaceSelected}
                    onChange={handleAddressLineChange}
                    id="instant-address-autocomplete"
                    required
                  />
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
            ) : `Save ${isPickupAddress ? 'Pickup' : 'Delivery'} Address`}
          </Button>
        </form>
      </Form>
    </Card>
  );
};

export default InstantAddressForm;

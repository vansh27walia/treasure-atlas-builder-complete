
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { addressService } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

interface SimpleAddressFormValues {
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('pickup-addresses');
  const [useAlternativeForm, setUseAlternativeForm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const form = useForm<SimpleAddressFormValues>({
    defaultValues: {
      name: '',
      street1: '',
      city: '',
      state: '',
      zip: '',
      isDefault: true,
    }
  });

  // Handle Google autocomplete address selection
  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      console.log("Google Place selected in simple form:", place);
      
      if (!place) {
        console.warn("No place data received");
        return;
      }
      
      const { street1, city, state, zip, country } = extractAddressComponents(place);
      
      console.log("Extracted components for simple form:", { street1, city, state, zip, country });
      
      // Set all the form values at once
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
      toast.error('Failed to process selected address. Please fill in the fields manually.');
    }
  };

  // Handle address line changes directly from the autocomplete
  const handleAddressLineChange = (value: string) => {
    form.setValue('street1', value, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: SimpleAddressFormValues) => {
    if (!user) {
      toast.error('You need to be logged in to save addresses');
      return;
    }

    setIsSubmitting(true);

    try {
      const addressData = {
        name: values.name,
        street1: values.street1,
        street2: '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: 'US',
        company: '',
        phone: '',
        is_default_from: values.isDefault,
        is_default_to: false,
      };

      // Try both standard and encryption methods
      let savedAddress = null;
      
      try {
        // Try standard method first
        savedAddress = await addressService.createAddress(addressData, false);
      } catch (standardError) {
        console.log('Standard create failed, trying with encryption', standardError);
        // If standard fails, try with encryption
        savedAddress = await addressService.createAddress(addressData, true);
      }

      if (savedAddress) {
        toast.success('Address saved successfully!');
        form.reset();
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                onClick={() => setUseAlternativeForm(!useAlternativeForm)}
              >
                {useAlternativeForm ? "Use Standard Form" : "Use Simple Form"}
              </Button>
            </div>
            
            {useAlternativeForm ? (
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Simple Address Form with Google Autocomplete</h2>
                <p className="text-gray-500 mb-4">Use this simplified form with Google autocomplete to quickly add a pickup address</p>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Name</FormLabel>
                          <FormControl>
                            <Input required placeholder="Home, Office, etc." {...field} />
                          </FormControl>
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
                              id="simple-address-autocomplete"
                              required
                            />
                          </FormControl>
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
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="isDefault"
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
                              Set as default pickup address
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : 'Save Address'}
                    </Button>
                  </form>
                </Form>
              </Card>
            ) : (
              <PickupAddressSettings />
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="shipping">
          <Card className="p-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Shipping Options</h2>
              <p>Configure your shipping preferences, carriers, and default packaging options.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Default Packaging</h3>
                  <p className="text-gray-600">Set your default packaging and dimensions</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Carrier Preferences</h3>
                  <p className="text-gray-600">Manage your preferred shipping carriers</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

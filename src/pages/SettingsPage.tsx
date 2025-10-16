import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import PaymentMethodManager from '@/components/payment/PaymentMethodManager';
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
import { supabase } from '@/integrations/supabase/client';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';

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
  const [searchParams] = useSearchParams();
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

  // Handle Stripe success callback
  useEffect(() => {
    const handleStripeCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const isSetup = searchParams.get('setup') === 'true';
      const canceled = searchParams.get('canceled') === 'true';

      if (sessionId && isSetup) {
        // Switch to payment methods tab immediately
        setActiveTab('payment-methods');
        
        try {
          // Call backend to process the checkout success and save payment method
          const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
            body: { session_id: sessionId }
          });

          if (error) {
            console.error('Error processing checkout success:', error);
            toast.error('Failed to save payment method. Please try again.');
          } else {
            toast.success('Payment method added successfully!');
            // The PaymentMethodManager will automatically refresh the list
          }
        } catch (error) {
          console.error('Error calling handle-checkout-success:', error);
          toast.error('Failed to save payment method. Please try again.');
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/settings');
      } else if (canceled) {
        toast.error('Payment setup was canceled');
        setActiveTab('payment-methods');
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/settings');
      }
    };

    handleStripeCallback();
  }, [searchParams]);

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
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

        <TabsContent value="payment-methods">
          <PaymentMethodManager />
        </TabsContent>
        
        <TabsContent value="shipping">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Shipping Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Preferred Carriers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['USPS', 'UPS', 'FedEx', 'DHL'].map((carrier) => (
                      <label key={carrier} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <Checkbox id={carrier} />
                        <span className="text-sm font-medium">{carrier}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Default Service Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Ground', 'Express', 'Overnight'].map((service) => (
                      <label key={service} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="service-level" value={service} />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Default Package Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Parcel', 'Flat Rate Box', 'Envelope', 'Custom'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="package-type" value={type} />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Insurance Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <Checkbox id="auto-insurance" />
                      <span className="text-sm">Automatically add insurance for shipments over $100</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox id="signature-confirmation" />
                      <span className="text-sm">Require signature confirmation by default</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <Checkbox id="email-tracking" />
                      <span className="text-sm">Send tracking emails to recipients</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox id="delivery-alerts" />
                      <span className="text-sm">Receive delivery confirmation alerts</span>
                    </label>
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  Save Shipping Preferences
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Unified AI Chatbot */}
      <ShipAIChatbot />
    </div>
  );
};

export default SettingsPage;

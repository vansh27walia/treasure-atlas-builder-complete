import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Building2, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { userProfileService } from '@/services/UserProfileService';
import { addressService, SavedAddress } from '@/services/AddressService';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void | Promise<void>;
}

interface OnboardingFormValues {
  // Pickup Address
  firstName: string;
  lastName: string;
  pickupName: string;
  pickupCompany: string;
  pickupStreet1: string;
  pickupStreet2: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupCountry: string;
  pickupPhone: string;
}

type PaymentChoice = 'card' | 'bank';

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pickup' | 'payment'>('pickup');
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('card');

  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      pickupName: '',
      pickupCompany: '',
      pickupStreet1: '',
      pickupStreet2: '',
      pickupCity: '',
      pickupState: '',
      pickupZip: '',
      pickupCountry: 'US',
      pickupPhone: '',
    },
  });

  const paymentOptions = useMemo(
    () => [
      {
        id: 'card' as const,
        title: 'Credit / Debit Card',
        description: 'Visa, Mastercard, AmEx',
        icon: <CreditCard className="w-5 h-5" />,
        payment_method_types: ['card'],
      },
      {
        id: 'bank' as const,
        title: 'Bank Transfer',
        description: 'US bank account (ACH)',
        icon: <Building2 className="w-5 h-5" />,
        payment_method_types: ['us_bank_account'],
      },
    ],
    []
  );

  // Handle Google Maps autocomplete selection
  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      const { street1, city, state, zip } = extractAddressComponents(place);
      if (street1) form.setValue('pickupStreet1', street1, { shouldValidate: true });
      if (city) form.setValue('pickupCity', city, { shouldValidate: true });
      if (state) form.setValue('pickupState', state, { shouldValidate: true });
      if (zip) form.setValue('pickupZip', zip, { shouldValidate: true });
      toast.success('Address details populated');
    } catch (error) {
      console.error('Error processing Google place selection:', error);
      toast.error('Failed to process selected address');
    }
  };

  const finishOnboarding = async () => {
    setIsLoading(true);
    try {
      await onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipPickup = async () => {
    setActiveTab('payment');
  };

  const handleCancel = async () => {
    toast.message('You can finish setup later in Settings.');
    await finishOnboarding();
  };

  const handleBack = () => {
    if (activeTab === 'payment') setActiveTab('pickup');
  };

  const validateAddress = (formPart: 'pickup') => {
    const requiredFields = [
      `${formPart}Street1`,
      `${formPart}City`,
      `${formPart}State`,
      `${formPart}Zip`,
      `${formPart}Country`,
    ] as const;

    return requiredFields.every((field) => {
      const value = form.getValues(field);
      return value && value.trim() !== '';
    });
  };

  const handleSavePickup = async () => {
    const isValid = validateAddress('pickup');
    if (!isValid) {
      toast.error('Please fill in all required address fields');
      return;
    }

    setIsLoading(true);
    try {
      const values = form.getValues();
      const pickupAddress: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'> = {
        name: values.pickupName || 'Default Address',
        company: values.pickupCompany || undefined,
        street1: values.pickupStreet1,
        street2: values.pickupStreet2 || undefined,
        city: values.pickupCity,
        state: values.pickupState,
        zip: values.pickupZip,
        country: values.pickupCountry,
        phone: values.pickupPhone,
        is_default_from: true,
        is_default_to: false,
      };

      const savedAddress = await addressService.createAddress(pickupAddress);
      if (!savedAddress) throw new Error('Failed to save pickup address');

      await userProfileService.updateDefaultPickupAddressId(savedAddress.id);
      toast.success('Pickup address saved');
      setActiveTab('payment');
    } catch (error) {
      console.error('Error saving pickup address:', error);
      toast.error('Failed to save pickup address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartStripeSetup = async () => {
    const selected = paymentOptions.find((o) => o.id === paymentChoice) ?? paymentOptions[0];

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'setup',
          payment_method_types: selected.payment_method_types,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error?.message || 'Failed to start Stripe checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) void handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome! Let’s set up your account</DialogTitle>
          <DialogDescription>
            Add your pickup address and optionally connect a payment method. You can cancel and do this later in Settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pickup' | 'payment')}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pickup">Pickup Location</TabsTrigger>
            <TabsTrigger value="payment">Payment Method</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <TabsContent value="pickup" className="space-y-4">
                <div className="bg-muted/40 border border-border p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Default pickup location</span> — save your primary shipping address now, or skip and add it later.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} required />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupCompany"
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
                    name="pickupPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pickupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Type *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="">Select address type...</option>
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Building">Building</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Other">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupStreet1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <AddressAutoComplete
                          placeholder="Start typing your address..."
                          defaultValue={field.value}
                          onAddressSelected={handleGooglePlaceSelected}
                          onChange={(value) => field.onChange(value)}
                          id="pickup-address-autocomplete"
                          required
                        />
                      </FormControl>
                      <FormDescription>Use autocomplete to fill city/state/zip faster.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupStreet2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Apartment, suite, unit, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State *</FormLabel>
                        <FormControl>
                          <Input placeholder="State" required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickupZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="ZIP code" required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" required {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <div className="bg-muted/40 border border-border p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Payment is handled on Stripe</span> — we never collect card or bank details inside ShippingQuick.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Choose a payment method to add</label>
                  <div className="grid gap-3">
                    {paymentOptions.map((opt) => {
                      const selected = paymentChoice === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentChoice(opt.id)}
                          className={`text-left w-full p-4 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {opt.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-foreground">{opt.title}</div>
                              <div className="text-sm text-muted-foreground">{opt.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <DialogFooter className="pt-4 flex justify-between">
                <div className="flex gap-2">
                  {activeTab === 'payment' && (
                    <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {activeTab === 'pickup' ? (
                    <>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button type="button" variant="ghost" onClick={handleSkipPickup} disabled={isLoading}>
                        Skip
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSavePickup}
                        disabled={isLoading || !validateAddress('pickup')}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save & Continue
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button type="button" onClick={handleStartStripeSetup} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redirecting…
                          </>
                        ) : (
                          <>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Continue to Stripe
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;


import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { userProfileService } from '@/services/UserProfileService';
import { addressService, SavedAddress } from '@/services/AddressService';
import AddressAutoComplete from '@/components/shipping/AddressAutoComplete';
import { extractAddressComponents } from '@/utils/addressUtils';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface OnboardingFormValues {
  // Pickup Address
  pickupName: string;
  pickupCompany: string;
  pickupStreet1: string;
  pickupStreet2: string;
  pickupCity: string;
  pickupState: string;
  pickupZip: string;
  pickupCountry: string;
  pickupPhone: string;
  
  // Payment Info
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  cvv: string;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pickup');
  
  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      pickupName: '',
      pickupCompany: '',
      pickupStreet1: '',
      pickupStreet2: '',
      pickupCity: '',
      pickupState: '',
      pickupZip: '',
      pickupCountry: 'US',
      pickupPhone: '',
      
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cardholderName: '',
      cvv: '',
    }
  });
  
  // Handle Google Maps autocomplete selection
  const handleGooglePlaceSelected = (place: GoogleMapsPlace) => {
    try {
      const { street1, city, state, zip } = extractAddressComponents(place);
      if (street1) form.setValue('pickupStreet1', street1, { shouldValidate: true });
      if (city) form.setValue('pickupCity', city, { shouldValidate: true });
      if (state) form.setValue('pickupState', state, { shouldValidate: true });
      if (zip) form.setValue('pickupZip', zip, { shouldValidate: true });
      toast.success('Address details populated from Google Maps');
    } catch (error) {
      console.error('Error processing Google place selection:', error);
      toast.error('Failed to process selected address');
    }
  };

  const handleSkipPickup = async () => {
    setActiveTab('payment');
  };

  const handleSkipPayment = async () => {
    try {
      await userProfileService.completeOnboarding();
      toast.success('Welcome! You can add your information later in settings.');
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('There was an error. Please try again.');
    }
  };
  
  const handleNext = () => {
    if (activeTab === 'pickup') {
      setActiveTab('payment');
    }
  };
  
  const handleBack = () => {
    if (activeTab === 'payment') {
      setActiveTab('pickup');
    }
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
        phone: values.pickupPhone || undefined,
        is_default_from: true,
        is_default_to: false,
      };
      
      const savedAddress = await addressService.createAddress(pickupAddress);
      
      if (!savedAddress) {
        throw new Error('Failed to save pickup address');
      }

      await userProfileService.updateDefaultPickupAddressId(savedAddress.id);
      toast.success('Pickup address saved!');
      setActiveTab('payment');
    } catch (error) {
      console.error('Error saving pickup address:', error);
      toast.error('Failed to save pickup address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    
    try {
      // Save payment information using Stripe
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('save-payment-method', {
        body: {
          cardNumber: values.cardNumber,
          expMonth: values.expiryMonth,
          expYear: values.expiryYear,
          cvc: values.cvv,
          cardholderName: values.cardholderName,
          setAsDefault: true
        }
      });

      if (error) {
        throw error;
      }
      
      // Mark onboarding as complete
      await userProfileService.completeOnboarding();
      
      toast.success('Payment method saved successfully!');
      onComplete();
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('Failed to save payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateAddress = (formPart: 'pickup') => {
    const requiredFields = [
      `${formPart}Street1`,
      `${formPart}City`,
      `${formPart}State`,
      `${formPart}Zip`,
      `${formPart}Country`,
    ] as const;
    
    return requiredFields.every(field => {
      const value = form.getValues(field);
      return value && value.trim() !== '';
    });
  };
  
  const validatePayment = () => {
    const requiredFields = [
      'cardNumber',
      'expiryMonth',
      'expiryYear',
      'cardholderName',
      'cvv',
    ] as const;
    
    const valid = requiredFields.every(field => {
      const value = form.getValues(field);
      return value && value.trim() !== '';
    });
    
    // Basic card number validation
    const cardNumber = form.getValues('cardNumber').replace(/\s/g, '');
    const validCardNumber = cardNumber.length >= 13 && cardNumber.length <= 19 && /^\d+$/.test(cardNumber);
    
    return valid && validCardNumber;
  };
  
  const isNextDisabled = () => {
    if (activeTab === 'pickup') {
      return !validateAddress('pickup');
    }
    return true;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome! Let's set up your account</DialogTitle>
          <DialogDescription>
            Add your pickup address and payment method to get started faster. You can skip these steps and add them later.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pickup">Pickup Location</TabsTrigger>
            <TabsTrigger value="payment">Payment Info</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="pickup" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Save your default pickup location</strong> - Add your primary shipping address now, or skip and add it later in settings.
                  </p>
                </div>
              
                <FormField
                  control={form.control}
                  name="pickupName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Home, Office, etc." {...field} />
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
                  name="pickupCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Company name (optional)" {...field} />
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
                      <FormLabel>Address Line 1 with Google Autocomplete *</FormLabel>
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
                      <FormDescription>
                        Use Google autocomplete to quickly fill address details
                      </FormDescription>
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
                
                <FormField
                  control={form.control}
                  name="pickupPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="payment" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Add a payment method</strong> - Save your card details for faster checkout, or skip and add it when needed.
                  </p>
                </div>
                
                <FormField
                  control={form.control}
                  name="cardholderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cardholder Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Name on card" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="XXXX XXXX XXXX XXXX" 
                          required 
                          maxLength={19}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="expiryMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Month *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="MM" 
                            required 
                            maxLength={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiryYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Year *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="YY" 
                            required 
                            maxLength={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="XXX" 
                            required 
                            maxLength={4}
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <DialogFooter className="pt-4 flex justify-between">
                <div className="flex gap-2">
                  {activeTab === 'payment' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {activeTab === 'pickup' ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkipPickup}
                      >
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
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleSkipPayment}
                        disabled={isLoading}
                      >
                        Skip
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !validatePayment()}
                      >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Setup
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

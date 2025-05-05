
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
import { toast } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import { HomeAddress, PaymentInfo, userProfileService } from '@/services/UserProfileService';
import { addressService, SavedAddress } from '@/services/AddressService';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

interface OnboardingFormValues {
  // Home Address
  homeName: string;
  homeStreet1: string;
  homeStreet2: string;
  homeCity: string;
  homeState: string;
  homeZip: string;
  homeCountry: string;
  homePhone: string;
  
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
  const [activeTab, setActiveTab] = useState('home');
  
  const form = useForm<OnboardingFormValues>({
    defaultValues: {
      homeName: '',
      homeStreet1: '',
      homeStreet2: '',
      homeCity: '',
      homeState: '',
      homeZip: '',
      homeCountry: 'US',
      homePhone: '',
      
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
  
  const handleNext = () => {
    if (activeTab === 'home') {
      setActiveTab('pickup');
    } else if (activeTab === 'pickup') {
      setActiveTab('payment');
    }
  };
  
  const handleBack = () => {
    if (activeTab === 'pickup') {
      setActiveTab('home');
    } else if (activeTab === 'payment') {
      setActiveTab('pickup');
    }
  };
  
  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    
    try {
      // 1. Save home address
      const homeAddress: HomeAddress = {
        name: values.homeName,
        street1: values.homeStreet1,
        street2: values.homeStreet2 || undefined,
        city: values.homeCity,
        state: values.homeState,
        zip: values.homeZip,
        country: values.homeCountry,
        phone: values.homePhone || undefined,
      };
      
      const homeAddressSaved = await userProfileService.updateHomeAddress(homeAddress);
      
      if (!homeAddressSaved) {
        throw new Error('Failed to save home address');
      }
      
      // 2. Save pickup address
      const pickupAddress: Omit<SavedAddress, 'id' | 'user_id' | 'created_at'> = {
        name: values.pickupName,
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
      
      // 3. Save payment information
      const paymentInfo: PaymentInfo = {
        card_number: values.cardNumber,
        exp_month: values.expiryMonth,
        exp_year: values.expiryYear,
        cardholder_name: values.cardholderName,
        last4: values.cardNumber.slice(-4),
      };
      
      const paymentInfoSaved = await userProfileService.updatePaymentInfo(paymentInfo);
      
      if (!paymentInfoSaved) {
        throw new Error('Failed to save payment information');
      }
      
      // 4. Set the default pickup address ID in the user profile
      await userProfileService.updateDefaultPickupAddressId(savedAddress.id);
      
      // 5. Mark onboarding as complete
      await userProfileService.completeOnboarding();
      
      toast.success('Your profile has been set up successfully!');
      onComplete();
    } catch (error) {
      console.error('Error during onboarding:', error);
      toast.error('There was an error setting up your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateAddress = (formPart: 'home' | 'pickup') => {
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
    if (activeTab === 'home') {
      return !validateAddress('home');
    } else if (activeTab === 'pickup') {
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
            Please provide your details to get started. This information will help us streamline your shipping experience.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="home">Home Address</TabsTrigger>
            <TabsTrigger value="pickup">Pickup Location</TabsTrigger>
            <TabsTrigger value="payment">Payment Info</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="home" className="space-y-4">
                <FormField
                  control={form.control}
                  name="homeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="homeStreet1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" required {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="homeStreet2"
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
                    name="homeCity"
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
                    name="homeState"
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
                    name="homeZip"
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
                    name="homeCountry"
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
                  name="homePhone"
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
              
              <TabsContent value="pickup" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-blue-700">
                    Please provide your default pickup location. This is where your packages will be collected from when you create shipments. You can add additional pickup locations later in your settings.
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
                      <FormLabel>Address Line 1 *</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" required {...field} />
                      </FormControl>
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
                    Please provide your payment information. This will be used for your shipping transactions. Your information is encrypted and stored securely.
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
              
              <DialogFooter className="pt-4">
                {activeTab !== 'home' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="mr-2"
                  >
                    Back
                  </Button>
                )}
                
                {activeTab !== 'payment' ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !validatePayment()}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Setup
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

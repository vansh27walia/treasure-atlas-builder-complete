
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { Loader2, X } from 'lucide-react';
import { PaymentInfo, userProfileService } from '@/services/UserProfileService';
import { addressService, SavedAddress } from '@/services/AddressService';
import PickupAddressForm from './PickupAddressForm';
import PaymentInfoForm from './PaymentInfoForm';
import { OnboardingFormValues } from './OnboardingTypes';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
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
  
  const handleCancel = () => {
    form.reset();
    onComplete(); // Close the modal
  };
  
  const onSubmit = async (values: OnboardingFormValues) => {
    setIsLoading(true);
    
    try {
      // 1. Save pickup address
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
      
      // 2. Save payment information
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
      
      // 3. Set the default pickup address ID in the user profile
      await userProfileService.updateDefaultPickupAddressId(savedAddress.id);
      
      // 4. Mark onboarding as complete
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
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Welcome! Let's set up your account</DialogTitle>
          <DialogDescription>
            Please provide your details to get started. This information will help us streamline your shipping experience.
          </DialogDescription>
        </DialogHeader>
        <DialogClose 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          onClick={handleCancel}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </DialogClose>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="pickup">Pickup Location</TabsTrigger>
            <TabsTrigger value="payment">Payment Info</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="pickup">
                <PickupAddressForm form={form} />
              </TabsContent>
              
              <TabsContent value="payment">
                <PaymentInfoForm form={form} />
              </TabsContent>
              
              <DialogFooter className="pt-4">
                {activeTab !== 'pickup' && (
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

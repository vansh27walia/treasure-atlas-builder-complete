
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { OnboardingFormValues } from './OnboardingTypes';

interface PaymentInfoFormProps {
  form: UseFormReturn<OnboardingFormValues>;
}

const PaymentInfoForm: React.FC<PaymentInfoFormProps> = ({ form }) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default PaymentInfoForm;

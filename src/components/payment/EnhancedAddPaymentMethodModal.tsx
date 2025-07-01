
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Building2, Smartphone, Globe } from 'lucide-react';

const stripePromise = loadStripe(process.env.NODE_ENV === 'production' 
  ? 'pk_live_your_publishable_key_here' 
  : 'pk_test_51Oxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  types: string[];
  description: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Credit/Debit Cards',
    icon: <CreditCard className="w-5 h-5" />,
    types: ['card'],
    description: 'Visa, Mastercard, American Express, Discover'
  },
  {
    id: 'bank',
    name: 'Bank Transfer (ACH)',
    icon: <Building2 className="w-5 h-5" />,
    types: ['us_bank_account'],
    description: 'Direct bank account transfer'
  },
  {
    id: 'digital',
    name: 'Digital Wallets',
    icon: <Smartphone className="w-5 h-5" />,
    types: ['link'],
    description: 'Link, Apple Pay, Google Pay'
  },
  {
    id: 'international',
    name: 'International',
    icon: <Globe className="w-5 h-5" />,
    types: ['sepa_debit', 'sofort', 'ideal'],
    description: 'SEPA, SOFORT, iDEAL'
  }
];

interface EnhancedAddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentMethodForm: React.FC<{ 
  onSuccess: () => void; 
  onClose: () => void;
  selectedMethod: PaymentMethodOption;
}> = ({ onSuccess, onClose, selectedMethod }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Create setup intent with specific payment method types
      const { data: setupData, error: setupError } = await supabase.functions.invoke(
        'create-setup-intent',
        {
          body: { 
            payment_method_types: selectedMethod.types
          },
        }
      );

      if (setupError) throw setupError;

      let confirmResult;

      if (selectedMethod.id === 'card') {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error('Card element not found');

        confirmResult = await stripe.confirmCardSetup(
          setupData.client_secret,
          {
            payment_method: {
              card: cardElement,
            },
          }
        );
      } else if (selectedMethod.id === 'bank') {
        // For US bank accounts, we'd typically redirect to a bank connection flow
        // This is a simplified version - in production you'd use Stripe's bank account collection
        toast.info('Bank account setup requires additional verification. Redirecting...');
        return;
      } else {
        // For other payment methods, redirect to Stripe's hosted collection
        window.open(`https://js.stripe.com/v3/setup-intents/${setupData.setup_intent_id}`, '_blank');
        return;
      }

      if (confirmResult?.error) {
        throw new Error(confirmResult.error.message);
      }

      // Save payment method to database
      const { error: saveError } = await supabase.functions.invoke(
        'save-payment-method',
        {
          body: {
            setup_intent_id: confirmResult?.setupIntent?.id,
            is_default: isDefault,
          },
        }
      );

      if (saveError) throw saveError;

      toast.success('Payment method added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
        {selectedMethod.icon}
        <div>
          <h3 className="font-medium">{selectedMethod.name}</h3>
          <p className="text-sm text-gray-600">{selectedMethod.description}</p>
        </div>
      </div>

      {selectedMethod.id === 'card' && (
        <div className="p-4 border rounded-lg">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      )}

      {selectedMethod.id === 'bank' && (
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-blue-800">
            Bank account setup will redirect you to securely connect your bank account through Stripe's secure portal.
          </p>
        </div>
      )}

      {(selectedMethod.id === 'digital' || selectedMethod.id === 'international') && (
        <div className="p-4 border rounded-lg bg-green-50">
          <p className="text-sm text-green-800">
            This payment method will open in a new window for secure setup through Stripe.
          </p>
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-default"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(checked as boolean)}
        />
        <Label htmlFor="is-default">Set as default payment method</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading}>
          {isLoading ? 'Adding...' : `Add ${selectedMethod.name}`}
        </Button>
      </div>
    </form>
  );
};

const EnhancedAddPaymentMethodModal: React.FC<EnhancedAddPaymentMethodModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(paymentMethods[0]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue={selectedMethod.id} onValueChange={(value) => {
          const method = paymentMethods.find(m => m.id === value);
          if (method) setSelectedMethod(method);
        }}>
          <TabsList className="grid w-full grid-cols-4">
            {paymentMethods.map((method) => (
              <TabsTrigger key={method.id} value={method.id} className="flex items-center space-x-1">
                {method.icon}
                <span className="hidden sm:inline">{method.name.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {paymentMethods.map((method) => (
            <TabsContent key={method.id} value={method.id}>
              <Elements stripe={stripePromise}>
                <PaymentMethodForm 
                  onSuccess={onSuccess} 
                  onClose={onClose} 
                  selectedMethod={method}
                />
              </Elements>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddPaymentMethodModal;

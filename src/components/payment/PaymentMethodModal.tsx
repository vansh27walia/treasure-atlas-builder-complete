
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Building2, Smartphone, Globe, Shield, Lock } from 'lucide-react';

const stripePromise = loadStripe(process.env.NODE_ENV === 'production' 
  ? 'pk_live_your_publishable_key_here' 
  : 'pk_test_51Oxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  popular?: boolean;
  description: string;
  features: string[];
}

const paymentOptions: PaymentOption[] = [
  {
    id: 'card',
    title: 'Credit or Debit Card',
    subtitle: 'Visa, Mastercard, Amex, Discover',
    icon: <CreditCard className="w-6 h-6" />,
    popular: true,
    description: 'Most popular payment method',
    features: ['Instant processing', 'Secure tokenization', 'Supports all major cards']
  },
  {
    id: 'bank',
    title: 'Bank Account (ACH)',
    subtitle: 'Direct bank transfer',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Lower fees, takes 1-3 business days',
    features: ['Lower processing fees', 'Bank-level security', 'No card required']
  },
  {
    id: 'digital',
    title: 'Digital Wallets',
    subtitle: 'PayPal, Apple Pay, Google Pay',
    icon: <Smartphone className="w-6 h-6" />,
    description: 'Quick checkout with saved methods',
    features: ['One-click payments', 'Biometric security', 'No card details needed']
  }
];

const CardPaymentForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
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
      const { data: setupData, error: setupError } = await supabase.functions.invoke(
        'create-setup-intent',
        {
          body: { payment_method_types: ['card'] },
        }
      );

      if (setupError) throw setupError;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        setupData.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      const { error: saveError } = await supabase.functions.invoke(
        'save-payment-method',
        {
          body: {
            setup_intent_id: setupIntent.id,
            is_default: isDefault,
          },
        }
      );

      if (saveError) throw saveError;

      toast.success('Card added successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#374151',
                fontFamily: 'Inter, system-ui, sans-serif',
                '::placeholder': {
                  color: '#9CA3AF',
                },
                iconColor: '#6B7280',
              },
              invalid: {
                color: '#EF4444',
                iconColor: '#EF4444',
              },
            },
          }}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-default-card"
          checked={isDefault}
          onCheckedChange={(checked) => setIsDefault(checked as boolean)}
        />
        <Label htmlFor="is-default-card" className="text-sm font-medium">
          Set as default payment method
        </Label>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Shield className="w-4 h-4" />
        <span>Your card details are encrypted and stored securely with Stripe</span>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isLoading} className="min-w-[120px]">
          {isLoading ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </form>
  );
};

const BankAccountForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaidLink = async () => {
    setIsLoading(true);
    try {
      // This would integrate with Plaid Link in a real implementation
      toast.info('Bank account linking will be available soon. Plaid integration required.');
    } catch (error) {
      console.error('Error linking bank account:', error);
      toast.error('Failed to link bank account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-8 bg-blue-50 rounded-lg">
        <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Bank Account</h3>
        <p className="text-gray-600 mb-6">
          Securely link your bank account through our trusted partner Plaid. 
          Your login credentials are never stored.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <Lock className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">Bank-level Security</p>
          </div>
          <div className="text-center">
            <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">256-bit Encryption</p>
          </div>
          <div className="text-center">
            <Building2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">FDIC Insured</p>
          </div>
        </div>

        <Button 
          onClick={handlePlaidLink} 
          disabled={isLoading}
          className="w-full max-w-xs"
        >
          {isLoading ? 'Connecting...' : 'Connect Bank Account'}
        </Button>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const DigitalWalletForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const [selectedWallet, setSelectedWallet] = useState<string>('');

  const wallets = [
    { id: 'paypal', name: 'PayPal', icon: '🟦' },
    { id: 'apple_pay', name: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', name: 'Google Pay', icon: '🔴' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {wallets.map((wallet) => (
          <Card 
            key={wallet.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedWallet === wallet.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedWallet(wallet.id)}
          >
            <CardContent className="p-4 flex items-center space-x-3">
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium">{wallet.name}</h4>
                <p className="text-sm text-gray-600">Pay with your {wallet.name} account</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center p-6 bg-amber-50 rounded-lg">
        <Smartphone className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="text-sm text-amber-800">
          Digital wallet integration coming soon. This will redirect to your selected provider.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled>
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedOption, setSelectedOption] = useState('card');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Payment Method</DialogTitle>
          <p className="text-gray-600 mt-1">Choose how you'd like to pay for your shipments</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Payment Method Selection */}
          <div className="grid gap-3">
            {paymentOptions.map((option) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedOption === option.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedOption(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        {option.popular && (
                          <Badge variant="secondary" className="text-xs">Popular</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{option.subtitle}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Form */}
          <div className="border-t pt-6">
            {selectedOption === 'card' && (
              <Elements stripe={stripePromise}>
                <CardPaymentForm onSuccess={onSuccess} onClose={onClose} />
              </Elements>
            )}
            {selectedOption === 'bank' && (
              <BankAccountForm onSuccess={onSuccess} onClose={onClose} />
            )}
            {selectedOption === 'digital' && (
              <DigitalWalletForm onSuccess={onSuccess} onClose={onClose} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodModal;

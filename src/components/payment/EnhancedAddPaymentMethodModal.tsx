import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Building2, Smartphone, Globe, ExternalLink } from 'lucide-react';

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'all',
    name: 'All Payment Methods',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Cards, Bank Accounts, Digital Wallets, and more'
  },
  {
    id: 'cards',
    name: 'Cards Only',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Credit and Debit Cards (Visa, Mastercard, Amex)'
  },
  {
    id: 'bank',
    name: 'Bank Transfers',
    icon: <Building2 className="w-5 h-5" />,
    description: 'ACH, SEPA, and other bank transfers'
  },
  {
    id: 'digital',
    name: 'Digital Wallets',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'Apple Pay, Google Pay, Link by Stripe'
  }
];

interface EnhancedAddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EnhancedAddPaymentMethodModal: React.FC<EnhancedAddPaymentMethodModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>(paymentMethods[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Create checkout session in setup mode
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'setup',
          payment_method_types: getPaymentMethodTypes(selectedMethod.id)
        },
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  const getPaymentMethodTypes = (methodId: string): string[] => {
    switch (methodId) {
      case 'cards':
        return ['card'];
      case 'bank':
        return ['us_bank_account', 'sepa_debit'];
      case 'digital':
        return ['link'];
      default:
        return ['card', 'us_bank_account', 'link'];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5" />
            <span>Add Payment Method</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Choose your preferred payment method to securely save for future use.
            </p>

            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedMethod.id === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <div className="flex items-center space-x-3">
                    {method.icon}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{method.name}</h3>
                      <p className="text-xs text-gray-600">{method.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedMethod.id === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedMethod.id === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Secure Checkout</h4>
                <p className="text-blue-800 text-xs mt-1">
                  You'll be redirected to Stripe's secure payment page. All payment information is processed securely and never stored on our servers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Redirecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Continue to Stripe
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddPaymentMethodModal;
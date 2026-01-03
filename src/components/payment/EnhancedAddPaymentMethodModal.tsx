import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Building2, Smartphone, ExternalLink, Shield, Lock, CheckCircle2 } from 'lucide-react';

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  badges?: string[];
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'all',
    name: 'All Payment Methods',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Cards, Bank Accounts, Digital Wallets',
    badges: ['Most Popular']
  },
  {
    id: 'cards',
    name: 'Credit / Debit Card',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Visa, Mastercard, American Express',
    badges: ['Instant']
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    icon: <Building2 className="w-6 h-6" />,
    description: 'ACH Direct Debit, SEPA',
    badges: ['Lower Fees']
  },
  {
    id: 'digital',
    name: 'Digital Wallet',
    icon: <Smartphone className="w-6 h-6" />,
    description: 'Apple Pay, Google Pay, Link',
    badges: ['Quick']
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
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'setup',
          payment_method_types: getPaymentMethodTypes(selectedMethod.id)
        },
      });

      if (error) throw error;

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
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              Add Payment Method
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-2">
              Securely save a payment method for future transactions
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Select Payment Type
            </label>
            <div className="grid gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedMethod.id === method.id
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedMethod(method)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg transition-colors ${
                      selectedMethod.id === method.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{method.name}</h3>
                        {method.badges?.map((badge) => (
                          <span 
                            key={badge}
                            className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{method.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      selectedMethod.id === method.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    }`}>
                      {selectedMethod.id === method.id && (
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Badge */}
          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground text-sm">Secured by Stripe</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  256-bit encryption • PCI DSS compliant • Your data is never stored on our servers
                </p>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4 flex justify-end gap-3">
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
            className="min-w-[160px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground mr-2" />
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
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddPaymentMethodModal;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, ExternalLink, Shield, Lock } from 'lucide-react';

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentMethodAdded: () => void;
}

const AddPaymentMethodModal: React.FC<AddPaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onPaymentMethodAdded
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          mode: 'setup',
          payment_method_types: ['card', 'us_bank_account', 'link']
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              Add Payment Method
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 mt-2">
              Securely add your payment details via Stripe
            </DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Secure Payment Setup</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You'll be redirected to Stripe's secure payment page to add your card, bank account, or digital wallet.
              </p>
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
                  256-bit encryption • PCI DSS compliant
                </p>
              </div>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 p-4 flex gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCheckout}
            disabled={isLoading}
            className="flex-1"
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

export default AddPaymentMethodModal;

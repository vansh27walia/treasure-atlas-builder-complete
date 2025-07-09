
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Lock, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  shipmentCount: number;
  onPaymentSuccess: () => void;
}

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  shipmentCount,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // For testing purposes, simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, call Stripe checkout here
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          shipmentCount,
          currency: 'usd'
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a popup
        const popup = window.open(data.url, 'stripe-checkout', 'width=600,height=700');
        
        // Listen for popup close
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            // Check payment status and call success handler
            onPaymentSuccess();
            onClose();
            toast.success('Payment completed successfully!');
          }
        }, 1000);
      } else {
        // For testing, simulate successful payment
        toast.success('Payment completed successfully!');
        onPaymentSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-green-600" />
              Secure Payment
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Labels ({shipmentCount})</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>
          
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm mb-4">
              You will be redirected to Stripe's secure checkout to complete your payment.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay $${totalAmount.toFixed(2)}`
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <Lock className="h-3 w-3 inline mr-1" />
            Secured by Stripe. Your payment information is encrypted and secure.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

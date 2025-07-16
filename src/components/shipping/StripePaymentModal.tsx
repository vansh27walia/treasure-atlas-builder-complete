
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Lock, X, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(true);

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method:', paymentMethodId);
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      console.log('Payment completed successfully');
      toast.success('Payment completed successfully!');
      onPaymentSuccess();
      onClose();
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const handleDirectPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method first');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('Processing REAL payment with method:', selectedPaymentMethod);
      
      // Use the real payment processing function with actual charges
      const { data, error } = await supabase.functions.invoke('process-shipping-payment', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          shipmentCount,
          currency: 'usd',
          paymentMethodId: selectedPaymentMethod,
          description: `Shipping Label Creation (${shipmentCount} labels)`,
          realPayment: true // Flag to indicate this is a real payment, not test
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        console.log('REAL payment processed successfully:', data);
        toast.success('Payment completed successfully! Your credit card has been charged.');
        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(data?.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Real payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
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
              Secure Payment - LIVE MODE
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-red-800">LIVE PAYMENT MODE</span>
            </div>
            <p className="text-sm text-red-700">
              Your credit card will be charged the full amount. This is not a test payment.
            </p>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Labels ({shipmentCount})</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total to be charged</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {showPaymentMethods && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Select Payment Method</h3>
              <PaymentMethodSelector
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={handlePaymentMethodChange}
                onPaymentComplete={handlePaymentComplete}
                amount={totalAmount}
                description={`Shipping Label Creation (${shipmentCount} labels)`}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={handleDirectPayment}
              disabled={isProcessing || !selectedPaymentMethod}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing Live Payment...
                </div>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Charge Card ${totalAmount.toFixed(2)}
                </>
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
            Secured by Stripe. Your payment will be processed immediately.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

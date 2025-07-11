
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Lock, X, Shield, CheckCircle } from 'lucide-react';
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
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method:', paymentMethodId);
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      console.log('Payment completed successfully');
      setPaymentStep('success');
      
      // Show success state briefly, then trigger label creation
      setTimeout(() => {
        toast.success('Payment successful! Creating labels automatically...');
        onPaymentSuccess();
        onClose();
        setPaymentStep('select'); // Reset for next time
      }, 1500);
    } else {
      toast.error('Payment failed. Please try again.');
      setPaymentStep('select');
    }
  };

  const handleDirectPayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method first');
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');
    
    try {
      console.log('Processing payment with method:', selectedPaymentMethod);
      
      const { data, error } = await supabase.functions.invoke('process-shipping-payment', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          shipmentCount,
          currency: 'usd',
          paymentMethodId: selectedPaymentMethod,
          description: `Batch Label Creation (${shipmentCount} labels)`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        console.log('Payment processed successfully:', data);
        handlePaymentComplete(true);
      } else {
        throw new Error(data?.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentStep('select');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPaymentStep('select');
      setSelectedPaymentMethod(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              {paymentStep === 'success' ? 'Payment Successful!' : 'Complete Your Payment'}
            </span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Order Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Shipping Labels ({shipmentCount})</span>
                <span className="font-medium text-blue-800">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-blue-800">Total Amount</span>
                  <span className="text-lg text-blue-900">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Success State */}
          {paymentStep === 'success' && (
            <Card className="p-6 text-center bg-green-50 border-green-200">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
              <p className="text-green-700">Creating your shipping labels automatically...</p>
            </Card>
          )}

          {/* Payment Processing State */}
          {paymentStep === 'processing' && (
            <Card className="p-6 text-center bg-blue-50 border-blue-200">
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Processing Payment...</h3>
              <p className="text-blue-700">Please wait while we process your payment securely.</p>
            </Card>
          )}

          {/* Payment Selection State */}
          {paymentStep === 'select' && (
            <>
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900 flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-green-600" />
                  Select Payment Method
                </h3>
                <PaymentMethodSelector
                  selectedPaymentMethod={selectedPaymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  onPaymentComplete={handlePaymentComplete}
                  amount={totalAmount}
                  description={`Batch Label Creation (${shipmentCount} labels)`}
                />
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleDirectPayment}
                  disabled={isProcessing || !selectedPaymentMethod}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay ${totalAmount.toFixed(2)} & Create Labels
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
            </>
          )}
          
          {/* Security Notice */}
          <div className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg">
            <Lock className="h-3 w-3 inline mr-1" />
            Your payment is secured by Stripe. All information is encrypted and processed securely.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

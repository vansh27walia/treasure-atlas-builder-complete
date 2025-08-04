
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, Lock, X, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date?: string;
  insurance_cost?: number;
  total_cost?: number;
}

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rate: ShippingRate | null;
  shipmentId: string | null;
  onPaymentSuccess: () => void;
}

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  isOpen,
  onClose,
  rate,
  shipmentId,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [showPaymentMethods, setShowPaymentMethods] = useState(true);

  const totalAmount = rate ? (rate.total_cost || parseFloat(rate.rate)) : 0;

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method:', paymentMethodId);
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      console.log('Payment completed successfully');
      toast.success('Payment completed successfully!');
      
      // Auto-refresh the page after successful payment
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
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
      console.log('Processing payment with method:', selectedPaymentMethod);
      
      const { data, error } = await supabase.functions.invoke('process-shipping-payment', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          currency: 'usd',
          paymentMethodId: selectedPaymentMethod,
          shipmentId: shipmentId,
          rateId: rate?.id,
          description: `Shipping Label - ${rate?.carrier} ${rate?.service}`
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        console.log('Payment processed successfully:', data);
        toast.success('Payment completed successfully!');
        
        // Auto-refresh the page after successful payment
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(data?.message || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!rate) {
    return null;
  }

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
            <h4 className="font-semibold text-blue-800 mb-2">Shipping Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Carrier</span>
                <span className="font-medium">{rate.carrier.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span>Service</span>
                <span>{rate.service}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{rate.delivery_days} business days</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total</span>
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
                description={`Shipping Label - ${rate.carrier} ${rate.service}`}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Button
              onClick={handleDirectPayment}
              disabled={isProcessing || !selectedPaymentMethod}
              className="w-full bg-blue-600 hover:bg-blue-700"
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
                  Pay ${totalAmount.toFixed(2)}
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
            Secured by Stripe. Your payment information is encrypted and secure.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

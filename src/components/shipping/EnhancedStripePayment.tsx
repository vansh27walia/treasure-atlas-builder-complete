
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Lock, X, Shield, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedStripePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  shipmentCount: number;
  onPaymentSuccess: () => void;
  shipmentDetails?: Array<{
    id: string;
    recipient: string;
    service: string;
    cost: number;
  }>;
}

const EnhancedStripePayment: React.FC<EnhancedStripePaymentProps> = ({
  isOpen,
  onClose,
  totalAmount,
  shipmentCount,
  onPaymentSuccess,
  shipmentDetails = []
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'summary' | 'processing' | 'success'>('summary');

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    setPaymentStep('processing');
    
    try {
      console.log('Creating Stripe checkout session...');
      
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          amount: Math.round(totalAmount * 100), // Convert to cents
          shipmentCount,
          currency: 'usd',
          metadata: {
            shipment_ids: shipmentDetails.map(s => s.id).join(','),
            type: 'bulk_shipping_labels'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        
        // Redirect to Stripe checkout
        window.location.href = data.url;
        
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
      setPaymentStep('summary');
    }
  };

  const renderSummaryStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Secure Payment
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-6">
        {/* Order Summary */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Shipping Labels ({shipmentCount})</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Processing Fee</span>
              <span>$0.00</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Shipment Details */}
        {shipmentDetails.length > 0 && (
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Shipment Details</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {shipmentDetails.slice(0, 5).map((shipment, index) => (
                <div key={shipment.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2">
                    {shipment.recipient} • {shipment.service}
                  </span>
                  <span>${shipment.cost.toFixed(2)}</span>
                </div>
              ))}
              {shipmentDetails.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{shipmentDetails.length - 5} more shipments
                </div>
              )}
            </div>
          </Card>
        )}
        
        {/* Payment Method */}
        <div className="text-center">
          <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-sm mb-4">
            Secure payment powered by Stripe. Your payment information is encrypted and never stored.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-4">
            <Badge variant="outline" className="text-xs">Visa</Badge>
            <Badge variant="outline" className="text-xs">Mastercard</Badge>
            <Badge variant="outline" className="text-xs">American Express</Badge>
            <Badge variant="outline" className="text-xs">Apple Pay</Badge>
            <Badge variant="outline" className="text-xs">Google Pay</Badge>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleStripeCheckout}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay with Stripe (${totalAmount.toFixed(2)})
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
          256-bit SSL encryption • PCI DSS compliant • Your data is secure
        </div>
      </div>
    </>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold mb-2">Redirecting to Stripe</h3>
      <p className="text-gray-600">Please wait while we redirect you to secure payment...</p>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-8">
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
      <p className="text-gray-600">Your shipping labels are being generated...</p>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {paymentStep === 'summary' && renderSummaryStep()}
        {paymentStep === 'processing' && renderProcessingStep()}
        {paymentStep === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedStripePayment;

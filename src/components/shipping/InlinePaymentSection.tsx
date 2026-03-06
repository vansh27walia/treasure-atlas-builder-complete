import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';

interface InlinePaymentSectionProps {
  selectedRate: any;
  shipmentDetails: any;
  onPaymentSuccess: (data: any) => void;
  insuranceCost?: number;
  isCreatingLabel?: boolean;
  onCancel?: () => void;
}

const InlinePaymentSection: React.FC<InlinePaymentSectionProps> = ({
  selectedRate,
  shipmentDetails,
  onPaymentSuccess,
  insuranceCost = 0,
  isCreatingLabel = false,
  onCancel
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isCreatingLabelState, setIsCreatingLabelState] = useState(false);

  const shippingCost = parseFloat(selectedRate.rate);
  const totalCost = shippingCost + (insuranceCost || 0);

  // Auto-scroll to payment section when it appears
  useEffect(() => {
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection) {
      setTimeout(() => {
        paymentSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, []);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handlePaymentComplete = async (success: boolean, paymentData?: any) => {
    if (!success) {
      toast.error('Payment failed. Please try again.');
      return;
    }

    setIsProcessing(true);
    setIsCreatingLabelState(true);
    
    try {
      console.log('Payment successful, creating label...');
      
      // Create label automatically after payment
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: {
          shipmentId: shipmentDetails?.id || selectedRate.shipment_id,
          rateId: selectedRate.id,
          options: {
            label_format: 'PDF',
            label_size: '4x6'
          },
          shopify_order_id: shipmentDetails?.shopify_order_id || undefined,
          shopify_shop: shipmentDetails?.shopify_shop || undefined,
        }
      });

      if (error) {
        console.error('Label creation error:', error);
        throw new Error(error.message || 'Failed to create label');
      }

      console.log('Label created successfully:', data);
      
      toast.success('Payment successful! Label created.');
      
      // Pass the label data to the parent component
      onPaymentSuccess({
        labelUrl: data.labelUrl,
        trackingCode: data.trackingCode,
        shipmentId: data.shipmentId,
        paymentData
      });

    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Payment successful but failed to create label. Please contact support.');
    } finally {
      setIsProcessing(false);
      setIsCreatingLabelState(false);
    }
  };

  return (
    <div id="payment-section" className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 border-2 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-blue-900">Complete Your Order</h3>
          <div className="flex items-center space-x-2">
            {onCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
            )}
            <div className="flex items-center text-sm text-blue-700">
              <Lock className="w-4 h-4 mr-1" />
              Secure Payment
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg p-4 mb-6 border border-blue-300">
          <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">
                {selectedRate.carrier} {selectedRate.service}
              </span>
              <span className="font-medium">${shippingCost.toFixed(2)}</span>
            </div>
            
            {insuranceCost > 0 && (
              <div className="flex justify-between items-center text-green-700">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Insurance</span>
                </div>
                <span className="font-medium">${insuranceCost.toFixed(2)}</span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-gray-700">
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Payment Method</span>
          </div>
          
          <PaymentMethodSelector
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
            onPaymentComplete={handlePaymentComplete}
            amount={totalCost}
            description={`${selectedRate.carrier} ${selectedRate.service} Shipping Label`}
            disabled={isProcessing || isCreatingLabel || isCreatingLabelState}
          />
        </div>

        {(isProcessing || isCreatingLabelState) && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              <span className="text-green-800">
                {isCreatingLabelState ? 'Creating your shipping label...' : 'Processing payment...'}
              </span>
            </div>
          </div>
        )}

        {/* Create Label Button - Always visible after payment method selection */}
        {selectedPaymentMethod && !isProcessing && !isCreatingLabelState && (
          <div className="mt-6 p-4 bg-green-50 border border-green-300 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Ready to create label</span>
              </div>
              <Button
                onClick={() => handlePaymentComplete(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isProcessing || isCreatingLabelState}
              >
                Create Label Now
              </Button>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          Your payment information is secured with 256-bit SSL encryption
        </div>
      </Card>
    </div>
  );
};

export default InlinePaymentSection;

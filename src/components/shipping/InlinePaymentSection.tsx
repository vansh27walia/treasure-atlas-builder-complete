
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

interface InlinePaymentSectionProps {
  rateAmount: number;
  insuranceAmount: number;
  totalAmount: number;
  selectedRate: any;
  shipmentId: string | null;
  onPaymentSuccess: () => void;
}

const InlinePaymentSection: React.FC<InlinePaymentSectionProps> = ({
  rateAmount,
  insuranceAmount,
  totalAmount,
  selectedRate,
  shipmentId,
  onPaymentSuccess
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInsuranceDetails, setShowInsuranceDetails] = useState(false);

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      onPaymentSuccess();
    }
  };

  return (
    <Card className="border-t-4 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-full">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Secure Payment</h3>
              <p className="text-sm text-gray-600">Complete your shipping label purchase</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            SSL Secured
          </Badge>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Shipping Label ({selectedRate?.carrier} {selectedRate?.service})</span>
              <span className="font-medium">${rateAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>Insurance Coverage ($100)</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowInsuranceDetails(!showInsuranceDetails)}
                  className="h-5 w-5 p-0"
                >
                  {showInsuranceDetails ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <span className="font-medium">${insuranceAmount.toFixed(2)}</span>
            </div>
            {showInsuranceDetails && (
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 border-l-4 border-blue-400">
                <p className="font-medium mb-1">Insurance Coverage Details:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Covers up to $100 for lost or damaged packages</li>
                  <li>Automatic claims processing</li>
                  <li>No additional documentation required</li>
                  <li>Coverage applies from pickup to delivery</li>
                </ul>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </h4>
          <PaymentMethodSelector
            selectedPaymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={handlePaymentMethodChange}
            onPaymentComplete={handlePaymentComplete}
            amount={totalAmount}
            description={`Shipping Label - ${selectedRate?.carrier} ${selectedRate?.service}`}
          />
        </div>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 rounded">
          <Lock className="h-3 w-3 inline mr-1" />
          Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.
        </div>
      </CardContent>
    </Card>
  );
};

export default InlinePaymentSection;

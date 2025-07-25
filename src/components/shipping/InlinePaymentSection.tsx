
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Shield, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useShippingRates } from '@/hooks/useShippingRates';

interface InlinePaymentSectionProps {
  selectedRate: any;
  onProceedToPayment: () => void;
}

const InlinePaymentSection: React.FC<InlinePaymentSectionProps> = ({
  selectedRate,
  onProceedToPayment
}) => {
  const { isProcessingPayment } = useShippingRates();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');

  if (!selectedRate) return null;

  const rate = parseFloat(selectedRate.rate);
  const tax = rate * 0.08; // 8% tax
  const total = rate + tax;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="w-6 h-6 text-blue-600" />
          Complete Your Payment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Selected Rate Summary */}
        <div className="bg-white p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {selectedRate.carrier} {selectedRate.service}
              </h3>
              <p className="text-sm text-gray-600">
                Delivery: {selectedRate.delivery_days} business days
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Selected
            </Badge>
          </div>
          
          {/* Price Breakdown */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span>Shipping Rate</span>
              <span>${rate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Payment Method</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="flex items-center gap-2 p-4 h-auto"
            >
              <CreditCard className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Credit Card</div>
                <div className="text-xs opacity-80">Instant processing</div>
              </div>
            </Button>
            
            <Button
              variant={paymentMethod === 'bank' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('bank')}
              className="flex items-center gap-2 p-4 h-auto"
            >
              <Shield className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Bank Transfer</div>
                <div className="text-xs opacity-80">Secure payment</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Security Features */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Secure Payment</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              256-bit SSL encryption
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              PCI DSS compliant
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Money-back guarantee
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onProceedToPayment}
            disabled={isProcessingPayment}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold shadow-lg"
            size="lg"
          >
            {isProcessingPayment ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Processing Payment...
              </>
            ) : (
              <>
                Pay ${total.toFixed(2)} & Create Label
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Label will be generated instantly after payment</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InlinePaymentSection;

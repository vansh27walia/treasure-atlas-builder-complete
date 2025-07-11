
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Package, Truck, DollarSign, Shield, Clock, CheckCircle, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

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
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Payment processed successfully!');
      onPaymentSuccess();
      onClose();
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onValueChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-7 h-7 mr-3 text-blue-600" />
              Complete Your Payment
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-lg text-gray-600">
            Securely pay for your shipping labels and get them instantly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Package className="w-6 h-6 mr-2 text-blue-600" />
                Order Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <span className="text-lg font-medium text-gray-700">
                      Shipping Labels
                    </span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {shipmentCount} {shipmentCount === 1 ? 'label' : 'labels'}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-xl font-bold">
                  <span className="text-gray-900">Total Amount</span>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <span className="text-green-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-green-800">Secure Payment</div>
                <div className="text-green-600 text-sm">256-bit SSL encryption</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-blue-800">Instant Labels</div>
                <div className="text-blue-600 text-sm">Ready in seconds</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <CheckCircle className="w-6 h-6 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-purple-800">Money Back</div>
                <div className="text-purple-600 text-sm">100% guarantee</div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <p className="text-gray-700 text-lg">
                  Your payment will be processed securely through Stripe
                </p>
                <p className="text-gray-600">
                  After payment, your labels will be generated automatically and ready for download
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-6 space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="px-6 py-3 text-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-3 h-5 w-5" />
                Pay ${totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StripePaymentModal;

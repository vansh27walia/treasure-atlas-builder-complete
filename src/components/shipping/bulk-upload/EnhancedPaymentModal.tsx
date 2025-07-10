
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Check, Loader2, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';

interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  shipmentCount: number;
  onPaymentSuccess: () => void;
}

const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  shipmentCount,
  onPaymentSuccess
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'processing' | 'success'>('select');

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      setPaymentStep('processing');
      setIsProcessing(true);
      
      // Simulate processing time for better UX
      setTimeout(() => {
        setPaymentStep('success');
        toast.success('Payment processed successfully!');
        
        // Auto-close and trigger label creation after a brief success display
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
          setPaymentStep('select');
          setIsProcessing(false);
        }, 2000);
      }, 1500);
    } else {
      toast.error('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setPaymentStep('select');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            Complete Payment for Batch Labels
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Order Summary</h3>
                  <p className="text-blue-700">Bulk shipping label creation</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-900">${totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-blue-600">{shipmentCount} labels</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Labels:</span>
                  <span className="font-medium">{shipmentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate per label:</span>
                  <span className="font-medium">${(totalAmount / shipmentCount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Steps */}
          {paymentStep === 'select' && (
            <div className="space-y-6">
              <PaymentMethodSelector
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={setSelectedPaymentMethod}
                onPaymentComplete={handlePaymentComplete}
                amount={totalAmount}
                description={`Bulk Label Creation (${shipmentCount} labels)`}
              />
            </div>
          )}

          {paymentStep === 'processing' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we process your payment...</p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600">Starting label creation process...</p>
            </div>
          )}

          {/* Action Buttons */}
          {paymentStep === 'select' && (
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedPaymentModal;

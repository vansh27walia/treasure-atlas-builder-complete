
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PaymentMethodList from './PaymentMethodList';
import AddPaymentMethodModal from './AddPaymentMethodModal';

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (methodId: string) => void;
  onPaymentComplete: (success: boolean) => void;
  amount: number;
  description: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedPaymentMethod,
  onPaymentMethodChange,
  onPaymentComplete,
  amount,
  description
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    try {
      // Process payment logic here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate payment processing
      toast.success('Payment processed successfully');
      onPaymentComplete(true);
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
      onPaymentComplete(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodAdded = () => {
    setShowAddPaymentModal(false);
    toast.success('Payment method added successfully');
    // Optionally refresh the payment methods list
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Select payment method:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPaymentModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>

          <PaymentMethodList
            selectedMethod={selectedPaymentMethod}
            onSelectMethod={onPaymentMethodChange}
          />

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">${amount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{description}</p>
            
            <Button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddPaymentMethodModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        onPaymentMethodAdded={handlePaymentMethodAdded}
      />
    </div>
  );
};

export default PaymentMethodSelector;



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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            ${amount.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <PaymentMethodList
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAddPaymentModal(true)}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
          
          <Button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </div>

        {showAddPaymentModal && (
          <AddPaymentMethodModal
            isOpen={showAddPaymentModal}
            onClose={() => setShowAddPaymentModal(false)}
            onPaymentMethodAdded={handlePaymentMethodAdded}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;


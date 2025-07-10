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
  return;
};
export default PaymentMethodSelector;
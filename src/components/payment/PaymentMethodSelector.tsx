import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Plus, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import PaymentMethodList from './PaymentMethodList';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (methodId: string) => void;
  onPaymentComplete: (success: boolean) => void;
  amount: number;
  description: string;
  onClose?: () => void;
}
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedPaymentMethod,
  onPaymentMethodChange,
  onPaymentComplete,
  amount,
  description,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Mock payment methods for dropdown
  const paymentMethods = [{
    id: 'card_1',
    name: 'Visa ending in 4242',
    type: 'visa'
  }, {
    id: 'card_2',
    name: 'Mastercard ending in 5555',
    type: 'mastercard'
  }, {
    id: 'card_3',
    name: 'American Express ending in 0005',
    type: 'amex'
  }];
  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      toast.success('Payment processed successfully!');

      // Call completion handler
      onPaymentComplete(true);

      // Close modal if provided
      if (onClose) {
        setTimeout(() => onClose(), 1000);
      }
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
  };
  return <div className="w-full max-w-md mx-auto">
      

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && <AddPaymentMethodModal isOpen={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} onPaymentMethodAdded={handlePaymentMethodAdded} />}
    </div>;
};
export default PaymentMethodSelector;
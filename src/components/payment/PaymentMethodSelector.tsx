
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, Plus, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import PaymentMethodList from './PaymentMethodList';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const paymentMethods = [
    { id: 'card_1', name: 'Visa ending in 4242', type: 'visa' },
    { id: 'card_2', name: 'Mastercard ending in 5555', type: 'mastercard' },
    { id: 'card_3', name: 'American Express ending in 0005', type: 'amex' },
  ];

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

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2 border-blue-200 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Amount Display */}
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-800">
              ${amount.toFixed(2)}
            </div>
            <p className="text-sm text-green-600 mt-1">{description}</p>
          </div>

          {/* Payment Method Selection with Dropdown */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Select Payment Method</h3>
            
            <Select value={selectedPaymentMethod || ""} onValueChange={onPaymentMethodChange}>
              <SelectTrigger className="w-full border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                <SelectValue placeholder="Choose a payment method">
                  {selectedPaymentMethod && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gray-200 shadow-lg">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id} className="cursor-pointer hover:bg-blue-50">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {method.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handlePayment}
              disabled={!selectedPaymentMethod || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Pay ${amount.toFixed(2)}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowAddPaymentModal(true)}
              className="w-full border-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <AddPaymentMethodModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          onPaymentMethodAdded={handlePaymentMethodAdded}
        />
      )}
    </div>
  );
};

export default PaymentMethodSelector;

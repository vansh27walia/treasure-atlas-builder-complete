
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AddPaymentMethodModal from './AddPaymentMethodModal';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (paymentMethodId: string) => void;
  onPaymentComplete: (success: boolean) => void;
  amount: number;
  description?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedPaymentMethod,
  onPaymentMethodChange,
  onPaymentComplete,
  amount,
  description = "Shipping Payment",
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      
      const methods = data || [];
      setPaymentMethods(methods);
      
      // Auto-select default payment method
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod && !selectedPaymentMethod) {
        onPaymentMethodChange(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount,
          payment_method_id: selectedPaymentMethod,
          description,
        },
      });

      if (error) throw error;

      if (data.requires_action) {
        // Handle 3D Secure or other authentication
        console.log('Payment requires additional authentication');
        onPaymentComplete(false);
      } else if (data.status === 'succeeded') {
        onPaymentComplete(true);
      } else {
        onPaymentComplete(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentComplete(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select value={selectedPaymentMethod || ""} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method">
                {selectedPaymentMethod && (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.brand} ••••{' '}
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.last4}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {method.brand} •••• {method.last4}
                      {method.is_default && ' (Default)'}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium">Total: ${amount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button
          onClick={handlePayment}
          disabled={!selectedPaymentMethod || isProcessing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>

      <AddPaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchPaymentMethods();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default PaymentMethodSelector;


import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Building2, Smartphone, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FullScreenCheckoutModal from './FullScreenCheckoutModal';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  stripe_payment_method_id: string;
}

interface PaymentMethodSelectorProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (paymentMethodId: string) => void;
  onPaymentComplete: (success: boolean) => void;
  amount: number;
  description?: string;
}

const getPaymentMethodIcon = (brand: string) => {
  const brandLower = brand?.toLowerCase();
  if (['visa', 'mastercard', 'amex', 'discover'].includes(brandLower)) {
    return <CreditCard className="w-4 h-4" />;
  } else if (brandLower === 'us_bank_account') {
    return <Building2 className="w-4 h-4" />;
  } else if (['link', 'apple_pay', 'google_pay'].includes(brandLower)) {
    return <Smartphone className="w-4 h-4" />;
  } else {
    return <Globe className="w-4 h-4" />;
  }
};

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

  const formatPaymentMethodDisplay = (method: PaymentMethod) => {
    if (method.brand === 'us_bank_account') {
      return `Bank •••• ${method.last4}`;
    } else if (['link', 'apple_pay', 'google_pay'].includes(method.brand?.toLowerCase())) {
      return `${method.brand} Wallet`;
    } else {
      return `${method.brand} •••• ${method.last4}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Select value={selectedPaymentMethod || ""} onValueChange={onPaymentMethodChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select payment method">
                {selectedPaymentMethod && (
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(paymentMethods.find(m => m.id === selectedPaymentMethod)?.brand || '')}
                    <span>
                      {formatPaymentMethodDisplay(paymentMethods.find(m => m.id === selectedPaymentMethod)!)}
                      {paymentMethods.find(m => m.id === selectedPaymentMethod)?.is_default && ' (Default)'}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(method.brand)}
                    <span>
                      {formatPaymentMethodDisplay(method)}
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
          className="h-12 px-4"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div>
          <p className="text-lg font-semibold text-gray-900">Total: ${amount.toFixed(2)}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button
          onClick={handlePayment}
          disabled={!selectedPaymentMethod || isProcessing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Secure payments powered by Stripe • Your payment information is encrypted and secure
        </p>
      </div>

      <FullScreenCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchPaymentMethods();
          setIsModalOpen(false);
        }}
        mode="setup"
      />
    </div>
  );
};

export default PaymentMethodSelector;

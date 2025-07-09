
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Building2, Smartphone, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FullScreenCheckoutModal from './FullScreenCheckoutModal';
import { toast } from '@/components/ui/sonner';

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
  description = "Shipping Payment"
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSelectedMethod, setCurrentSelectedMethod] = useState<string | null>(selectedPaymentMethod);

  const fetchPaymentMethods = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('payment_methods').select('*').order('is_default', {
        ascending: false
      });
      if (error) throw error;
      const methods = data || [];
      setPaymentMethods(methods);

      // Auto-select default payment method if none selected
      const defaultMethod = methods.find(m => m.is_default);
      if (defaultMethod && !currentSelectedMethod) {
        setCurrentSelectedMethod(defaultMethod.id);
        onPaymentMethodChange(defaultMethod.id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handlePaymentMethodChange = (methodId: string) => {
    setCurrentSelectedMethod(methodId);
    onPaymentMethodChange(methodId);
  };

  const handlePayment = async () => {
    if (!currentSelectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setIsProcessing(true);
    try {
      console.log('Processing payment with:', {
        amount,
        payment_method_id: currentSelectedMethod,
        description
      });
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amount,
          payment_method_id: currentSelectedMethod,
          description
        }
      });
      if (error) {
        console.error('Payment error:', error);
        throw error;
      }
      console.log('Payment response:', data);
      if (data.success && data.status === 'succeeded') {
        toast.success('Payment successful!');

        // Dispatch custom event to trigger label creation
        const paymentCompleteEvent = new CustomEvent('payment-completed', {
          detail: {
            success: true,
            paymentIntentId: data.payment_intent_id,
            amount: amount
          }
        });
        document.dispatchEvent(paymentCompleteEvent);
        onPaymentComplete(true);
      } else if (data.requires_action) {
        toast.error('Payment requires additional authentication');
        onPaymentComplete(false);
      } else if (data.error) {
        toast.error(data.error);
        onPaymentComplete(false);
      } else {
        toast.error('Payment failed. Please try again.');
        onPaymentComplete(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
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
      return `${method.brand?.toUpperCase()} •••• ${method.last4}`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Payment Method</label>
        <Select value={currentSelectedMethod || ''} onValueChange={handlePaymentMethodChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a payment method" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                <div className="flex items-center space-x-2">
                  {getPaymentMethodIcon(method.brand)}
                  <span>{formatPaymentMethodDisplay(method)}</span>
                  {method.is_default && (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {paymentMethods.length === 0 && (
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No payment methods found</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="mt-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      )}

      <div className="flex space-x-2">
        <Button
          onClick={handlePayment}
          disabled={!currentSelectedMethod || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </Button>

        {paymentMethods.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <FullScreenCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPaymentMethodAdded={fetchPaymentMethods}
      />
    </div>
  );
};

export default PaymentMethodSelector;

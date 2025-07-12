
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreditCard, Building2, ChevronDown, Loader2, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  brand: string;
  last4: string;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
}

interface PaymentDropdownProps {
  amount: number;
  description?: string;
  shippingDetails?: any;
  onPaymentSuccess: () => void;
  disabled?: boolean;
  className?: string;
}

const PaymentDropdown: React.FC<PaymentDropdownProps> = ({
  amount,
  description = "Shipping payment",
  shippingDetails,
  onPaymentSuccess,
  disabled = false,
  className = "",
}) => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentMethodId: string) => {
    setProcessing(true);
    setIsOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('process-shipping-payment', {
        body: {
          payment_method_id: paymentMethodId,
          amount: amount,
          description: description,
          shipping_details: shippingDetails
        }
      });

      if (error) {
        console.error('Payment error:', error);
        throw new Error(error.message || 'Payment failed');
      }

      if (!data || !data.success) {
        throw new Error('Payment was not successful');
      }

      toast.success('Payment processed successfully!');
      onPaymentSuccess();
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getPaymentMethodIcon = (brand: string) => {
    if (brand === 'bank_account') {
      return <Building2 className="w-5 h-5" />;
    }
    return <CreditCard className="w-5 h-5" />;
  };

  const formatPaymentMethod = (method: PaymentMethod) => {
    if (method.brand === 'bank_account') {
      return `Bank Account •••• ${method.last4}`;
    }
    return `${method.brand.toUpperCase()} •••• ${method.last4}`;
  };

  const handleAddPaymentMethod = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  if (loading) {
    return (
      <div className={`${className} w-full`}>
        <Button disabled className="w-full h-16 text-lg bg-gray-100">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading Payment Methods...
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className} w-full`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            disabled={disabled || processing} 
            className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-between px-8"
            size="lg"
          >
            <div className="flex items-center space-x-4">
              <CreditCard className="w-6 h-6" />
              <div className="text-left">
                <div className="text-lg font-bold">Pay with Card</div>
                <div className="text-sm opacity-90">{paymentMethods.length} cards available</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-bold">${amount.toFixed(2)}</div>
                <div className="text-sm opacity-90">Total Amount</div>
              </div>
              <ChevronDown className="w-6 h-6" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-96 bg-white border shadow-2xl rounded-xl z-50">
          <DropdownMenuLabel className="font-bold text-xl px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <span>Select Payment Method</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</div>
                <div className="text-sm text-gray-600 font-normal">{description}</div>
              </div>
            </div>
          </DropdownMenuLabel>
          
          {paymentMethods.length === 0 ? (
            <div className="p-8 text-center">
              <Plus className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-6 text-lg">No payment methods saved</p>
              <Button 
                onClick={handleAddPaymentMethod}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {paymentMethods.map((method) => (
                  <DropdownMenuItem
                    key={method.id}
                    onClick={() => handlePayment(method.id)}
                    className="cursor-pointer p-6 hover:bg-blue-50 border-b last:border-b-0 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-5 w-full">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                        {getPaymentMethodIcon(method.brand)}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-900">
                          {formatPaymentMethod(method)}
                        </div>
                        {method.exp_month && method.exp_year && (
                          <div className="text-sm text-gray-500 mt-1">
                            Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                          </div>
                        )}
                        {method.is_default && (
                          <div className="text-xs text-blue-700 font-semibold bg-blue-100 px-3 py-1 rounded-full inline-block mt-2">
                            Default Payment Method
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">${amount.toFixed(2)}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleAddPaymentMethod}
                className="cursor-pointer p-6 hover:bg-green-50 text-green-700 font-semibold transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-3" />
                <span className="text-lg">Add New Payment Method</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PaymentDropdown;

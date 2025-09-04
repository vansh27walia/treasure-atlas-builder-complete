
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
      <div className={`${className} w-full max-w-md`}>
        <Button disabled className="w-full h-14 text-lg">
          <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          Loading Payment Methods...
        </Button>
      </div>
    );
  }

  return (
    <div className={`${className} w-full max-w-md`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            disabled={disabled || processing} 
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium flex items-center justify-between px-6"
            size="lg"
          >
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 mr-3" />
              <span>Pay with Card</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-xl font-bold">${amount.toFixed(2)}</div>
                <div className="text-xs opacity-90">{paymentMethods.length} cards</div>
              </div>
              <ChevronDown className="w-5 h-5" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80 bg-white border shadow-xl rounded-lg">
          <DropdownMenuLabel className="font-semibold text-lg px-4 py-3">
            Select Payment Method
          </DropdownMenuLabel>
          <div className="px-4 pb-2">
            <div className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">{description}</div>
          </div>
          <DropdownMenuSeparator />
          
          {paymentMethods.length === 0 ? (
            <div className="p-6 text-center">
              <Plus className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-4">No payment methods saved</p>
              <Button 
                onClick={handleAddPaymentMethod}
                variant="outline" 
                size="sm"
                className="w-full h-10"
              >
                Add Payment Method
              </Button>
            </div>
          ) : (
            <>
              {paymentMethods.map((method) => (
                <DropdownMenuItem
                  key={method.id}
                  onClick={() => handlePayment(method.id)}
                  className="cursor-pointer p-4 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="flex-shrink-0">
                      {getPaymentMethodIcon(method.brand)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-base">
                        {formatPaymentMethod(method)}
                      </div>
                      {method.exp_month && method.exp_year && (
                        <div className="text-sm text-gray-500">
                          Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                        </div>
                      )}
                      {method.is_default && (
                        <div className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded inline-block mt-1">
                          Default
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleAddPaymentMethod}
                className="cursor-pointer p-4 hover:bg-gray-50 text-blue-600"
              >
                <Plus className="w-5 h-5 mr-3" />
                <span className="font-medium">Add New Payment Method</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PaymentDropdown;


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
      return <Building2 className="w-4 h-4" />;
    }
    return <CreditCard className="w-4 h-4" />;
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
      <Button disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={disabled || processing} 
          className={`${className} bg-blue-600 hover:bg-blue-700`}
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${amount.toFixed(2)}
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white border shadow-lg">
        <DropdownMenuLabel className="font-semibold">
          Select Payment Method
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {paymentMethods.length === 0 ? (
          <div className="p-4 text-center">
            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">No payment methods saved</p>
            <Button 
              onClick={handleAddPaymentMethod}
              variant="outline" 
              size="sm"
              className="w-full"
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
                className="cursor-pointer p-3 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 w-full">
                  {getPaymentMethodIcon(method.brand)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {formatPaymentMethod(method)}
                    </div>
                    {method.exp_month && method.exp_year && (
                      <div className="text-xs text-gray-500">
                        Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                      </div>
                    )}
                    {method.is_default && (
                      <div className="text-xs text-blue-600 font-medium">Default</div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleAddPaymentMethod}
              className="cursor-pointer p-3 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4 mr-3" />
              <span className="text-sm">Add New Payment Method</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PaymentDropdown;

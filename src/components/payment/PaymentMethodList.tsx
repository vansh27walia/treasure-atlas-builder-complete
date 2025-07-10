
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentMethod {
  id: string;
  type: string;
  last_four: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodListProps {
  selectedPaymentMethod: string | null;
  onPaymentMethodChange: (methodId: string) => void;
}

const PaymentMethodList: React.FC<PaymentMethodListProps> = ({
  selectedPaymentMethod,
  onPaymentMethodChange
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment methods');
        setPaymentMethods([]);
      } else {
        setPaymentMethods(data || []);
      }
    } catch (error) {
      console.error('Error in fetchPaymentMethods:', error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ status: 'deleted' })
        .eq('id', methodId);

      if (error) {
        console.error('Error deleting payment method:', error);
        toast.error('Failed to delete payment method');
        return;
      }

      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error in handleDeletePaymentMethod:', error);
      toast.error('Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No payment methods found</p>
          <p className="text-sm text-gray-500 mt-2">Add a payment method to continue</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedPaymentMethod || ''} onValueChange={onPaymentMethodChange}>
        {paymentMethods.map((method) => (
          <div key={method.id} className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value={method.id} id={method.id} />
            <Label htmlFor={method.id} className="flex-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium">
                      {method.brand.toUpperCase()} •••• {method.last_four}
                    </div>
                    <div className="text-sm text-gray-500">
                      Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year.toString().slice(-2)}
                    </div>
                  </div>
                </div>
                {method.is_default && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Default
                  </span>
                )}
              </div>
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeletePaymentMethod(method.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default PaymentMethodList;

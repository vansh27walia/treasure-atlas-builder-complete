import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Building2, Plus, Loader2 } from 'lucide-react';
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

interface PaymentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  amount: number;
  description?: string;
  shippingDetails?: any;
}

const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount,
  description = "Shipping payment",
  shippingDetails
}) => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPaymentMethods(data || []);
      
      // Auto-select default payment method
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      } else if (data && data.length > 0) {
        setSelectedMethodId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethodId) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-shipping-payment', {
        body: {
          payment_method_id: selectedMethodId,
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
      onClose();
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

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              ${amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No payment methods saved</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add a payment method in Settings to continue
                </p>
                <Button onClick={() => { onClose(); navigate('/settings'); }} variant="outline">
                  Go to Settings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-medium">Select payment method:</label>
                {paymentMethods.map((method) => (
                  <Card
                    key={method.id}
                    className={`cursor-pointer transition-all ${
                      selectedMethodId === method.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMethodId(method.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        {getPaymentMethodIcon(method.brand)}
                        <div className="flex-1">
                          <div className="font-medium">
                            {formatPaymentMethod(method)}
                          </div>
                          {method.exp_month && method.exp_year && (
                            <div className="text-sm text-muted-foreground">
                              Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                            </div>
                          )}
                          {method.is_default && (
                            <div className="text-xs text-primary font-medium">Default</div>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedMethodId === method.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedMethodId === method.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={processing || !selectedMethodId}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${amount.toFixed(2)}`
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSelectionModal;
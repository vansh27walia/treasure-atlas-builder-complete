import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const isSetup = searchParams.get('setup') === 'true';

  useEffect(() => {
    const handleCheckoutSuccess = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        setSuccess(true);
        setPaymentDetails(data);
        
        if (isSetup) {
          toast.success('Payment method added successfully!');
        } else {
          toast.success('Payment completed successfully!');
        }
      } catch (error) {
        console.error('Error handling checkout success:', error);
        toast.error('There was an issue processing your payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    handleCheckoutSuccess();
  }, [sessionId, isSetup]);

  const handleContinue = () => {
    if (isSetup) {
      navigate('/settings');
    } else {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Processing your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionId || !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <CardTitle className="text-red-700">Payment Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              There was an issue processing your payment. Please try again or contact support if the problem persists.
            </p>
            <div className="flex space-x-2">
              <Button onClick={() => navigate('/settings')} className="flex-1">
                Return to Settings
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <CardTitle className="text-green-700">
              {isSetup ? 'Payment Method Added!' : 'Payment Successful!'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSetup ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your payment method has been securely saved and is ready to use for future purchases.
              </p>
              
              {paymentDetails?.payment_method && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {paymentDetails.payment_method.brand?.toUpperCase()} •••• {paymentDetails.payment_method.last4}
                    </p>
                    {paymentDetails.payment_method.is_default && (
                      <p className="text-sm text-green-600">Set as default payment method</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">
                Your payment has been processed successfully.
              </p>
              
              {paymentDetails?.payment_intent && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">
                    Amount: ${paymentDetails.payment_intent.amount} {paymentDetails.payment_intent.currency.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Transaction ID: {paymentDetails.payment_intent.id}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSetup ? 'Return to Settings' : 'Continue to Dashboard'}
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Secure payments powered by Stripe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
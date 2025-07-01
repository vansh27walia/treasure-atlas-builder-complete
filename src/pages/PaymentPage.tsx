
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import PaymentMethodSelector from '@/components/payment/PaymentMethodSelector';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState<number>(0);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  
  useEffect(() => {
    // Parse query parameters to get amount and shipment details
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    const shipmentIdParam = params.get('shipmentId');
    const rateIdParam = params.get('rateId');
    
    if (amountParam && shipmentIdParam && rateIdParam) {
      setAmount(parseFloat(amountParam));
      setShipmentId(shipmentIdParam);
      setRateId(rateIdParam);
      setIsLoading(false);
    } else {
      toast.error("Missing payment information");
      navigate('/');
    }
  }, [location, navigate]);

  const handlePaymentComplete = async (success: boolean) => {
    if (success && shipmentId && rateId) {
      try {
        // Here you would typically create the shipping label
        // For now, we'll just redirect to success page
        navigate(`/label-success?shipmentId=${shipmentId}&rateId=${rateId}`);
      } catch (error) {
        console.error('Error after payment:', error);
        toast.error('Payment successful but failed to process shipment');
      }
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 container mx-auto px-4">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shipping
        </Button>
        
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              <Package className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-3xl font-bold">Complete Your Shipping Purchase</h1>
            </div>
            <p className="text-gray-600">Select a payment method to purchase your shipping label</p>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentMethodSelector
                  selectedPaymentMethod={selectedPaymentMethod}
                  onPaymentMethodChange={setSelectedPaymentMethod}
                  onPaymentComplete={handlePaymentComplete}
                  amount={amount}
                  description={`Shipping Label - ${shipmentId}`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;

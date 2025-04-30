
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import PaymentProcessor from '@/components/payment/PaymentProcessor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState<number>(0);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [rateId, setRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Parse query parameters to get amount and shipment details
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    const shipmentIdParam = params.get('shipmentId');
    const rateIdParam = params.get('rateId');
    
    if (amountParam && shipmentIdParam && rateIdParam) {
      setAmount(parseInt(amountParam));
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
        // Create label after payment is complete
        const { data, error } = await supabase.functions.invoke('create-label', {
          body: { shipmentId, rateId }
        });

        if (error) throw new Error(error.message);
        
        // Redirect to success page with the label URL and tracking code
        navigate(`/label-success?labelUrl=${encodeURIComponent(data.labelUrl)}&trackingCode=${encodeURIComponent(data.trackingCode)}`);
      } catch (error) {
        console.error('Error creating label:', error);
        toast.error('Payment successful but failed to generate label');
      }
    } else {
      navigate('/');
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
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center">
              <Package className="h-8 w-8 text-blue-500 mr-2" />
              <h1 className="text-3xl font-bold">Complete Your Shipping Purchase</h1>
            </div>
            <p className="text-gray-600 mt-2">Enter your payment details to purchase your shipping label</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <PaymentProcessor amount={amount} onPaymentComplete={handlePaymentComplete} />
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;

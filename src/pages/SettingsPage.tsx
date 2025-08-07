
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import PaymentMethodManager from '@/components/payment/PaymentMethodManager';
import QuickAddressForm from '@/components/settings/QuickAddressForm';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('pickup-addresses');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Handle Stripe success callback
  useEffect(() => {
    const handleStripeCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const isSetup = searchParams.get('setup') === 'true';
      const canceled = searchParams.get('canceled') === 'true';

      if (sessionId && isSetup) {
        setActiveTab('payment-methods');
        
        try {
          const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
            body: { session_id: sessionId }
          });

          if (error) {
            console.error('Error processing checkout success:', error);
            toast.error('Failed to save payment method. Please try again.');
          } else {
            toast.success('Payment method added successfully!');
          }
        } catch (error) {
          console.error('Error calling handle-checkout-success:', error);
          toast.error('Failed to save payment method. Please try again.');
        }
        
        window.history.replaceState({}, document.title, '/settings');
      } else if (canceled) {
        toast.error('Payment setup was canceled');
        setActiveTab('payment-methods');
        window.history.replaceState({}, document.title, '/settings');
      }
    };

    handleStripeCallback();
  }, [searchParams]);

  const handleAddressSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <div className="space-y-6">
            <div className="flex justify-end mb-4">
              <QuickAddressForm onAddressSaved={handleAddressSaved} />
            </div>
            
            <PickupAddressSettings key={refreshKey} />
          </div>
        </TabsContent>

        <TabsContent value="payment-methods">
          <PaymentMethodManager />
        </TabsContent>
        
        <TabsContent value="shipping">
          <Card className="p-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Shipping Options</h2>
              <p>Configure your shipping preferences, carriers, and default packaging options.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Default Packaging</h3>
                  <p className="text-gray-600">Set your default packaging and dimensions</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Carrier Preferences</h3>
                  <p className="text-gray-600">Manage your preferred shipping carriers</p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

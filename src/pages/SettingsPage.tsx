import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import PaymentMethodManager from '@/components/payment/PaymentMethodManager';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ShipAIChatbot from '@/components/shipping/ShipAIChatbot';
import GoogleApiKeyModal from '@/components/settings/GoogleApiKeyModal';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>('pickup-addresses');

  // Handle Stripe success callback
  useEffect(() => {
    const handleStripeCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const isSetup = searchParams.get('setup') === 'true';
      const canceled = searchParams.get('canceled') === 'true';

      if (sessionId && isSetup) {
        // Switch to payment methods tab immediately
        setActiveTab('payment-methods');
        
        try {
          // Call backend to process the checkout success and save payment method
          const { data, error } = await supabase.functions.invoke('handle-checkout-success', {
            body: { session_id: sessionId }
          });

          if (error) {
            console.error('Error processing checkout success:', error);
            toast.error('Failed to save payment method. Please try again.');
          } else {
            toast.success('Payment method added successfully!');
            // The PaymentMethodManager will automatically refresh the list
          }
        } catch (error) {
          console.error('Error calling handle-checkout-success:', error);
          toast.error('Failed to save payment method. Please try again.');
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/settings');
      } else if (canceled) {
        toast.error('Payment setup was canceled');
        setActiveTab('payment-methods');
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/settings');
      }
    };

    handleStripeCallback();
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
          </TabsList>
          <GoogleApiKeyModal />
        </div>
        
        <TabsContent value="pickup-addresses">
          <PickupAddressSettings />
        </TabsContent>

        <TabsContent value="payment-methods">
          <PaymentMethodManager />
        </TabsContent>
        
        <TabsContent value="shipping">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Shipping Preferences</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Preferred Carriers</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['USPS', 'UPS', 'FedEx', 'DHL'].map((carrier) => (
                      <label key={carrier} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <Checkbox id={carrier} />
                        <span className="text-sm font-medium">{carrier}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Default Service Level</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Ground', 'Express', 'Overnight'].map((service) => (
                      <label key={service} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="service-level" value={service} />
                        <span className="text-sm font-medium">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Default Package Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Parcel', 'Flat Rate Box', 'Envelope', 'Custom'].map((type) => (
                      <label key={type} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="package-type" value={type} />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Insurance Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <Checkbox id="auto-insurance" />
                      <span className="text-sm">Automatically add insurance for shipments over $100</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox id="signature-confirmation" />
                      <span className="text-sm">Require signature confirmation by default</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Notification Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2">
                      <Checkbox id="email-tracking" />
                      <span className="text-sm">Send tracking emails to recipients</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox id="delivery-alerts" />
                      <span className="text-sm">Receive delivery confirmation alerts</span>
                    </label>
                  </div>
                </div>

                <Button className="w-full md:w-auto">
                  Save Shipping Preferences
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Unified AI Chatbot */}
      <ShipAIChatbot />
    </div>
  );
};

export default SettingsPage;

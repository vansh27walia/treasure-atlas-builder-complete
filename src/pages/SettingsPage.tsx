
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import SimpleAddressForm from '@/components/settings/SimpleAddressForm';
import { Card } from '@/components/ui/card';
import GoogleApiKeyInput from '@/components/settings/GoogleApiKeyInput';
import GoogleApiKeyForm from '@/components/settings/GoogleApiKeyForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage: React.FC = () => {
  const [useSimpleForm, setUseSimpleForm] = useState(false);
  const [refreshAddresses, setRefreshAddresses] = useState(0);

  // Force refresh of addresses when a new one is added via simple form
  const handleAddressSuccess = () => {
    setRefreshAddresses(prev => prev + 1);
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="pickup-addresses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
          <TabsTrigger value="api-keys">API Settings</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <div className="space-y-6">
            {useSimpleForm && (
              <Alert className="bg-blue-50 border-blue-200 mb-4">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle>Alternative Form</AlertTitle>
                <AlertDescription>
                  You're using the simplified address form. This alternative implementation provides a direct way to save addresses.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center space-x-2 mb-6">
              <Switch
                id="use-simple-form"
                checked={useSimpleForm}
                onCheckedChange={setUseSimpleForm}
              />
              <Label htmlFor="use-simple-form">Use simplified address form</Label>
            </div>
            
            {useSimpleForm ? (
              <SimpleAddressForm onSuccess={handleAddressSuccess} />
            ) : (
              <PickupAddressSettings key={refreshAddresses} />
            )}
          </div>
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
        
        <TabsContent value="api-keys">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <GoogleApiKeyInput />
            <GoogleApiKeyForm />
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card className="p-6">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Account Settings</h2>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-2">Authentication</h3>
                <button 
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

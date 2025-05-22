
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleApiKeyForm from '@/components/settings/GoogleApiKeyForm';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="pickup-addresses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <PickupAddressSettings />
        </TabsContent>
        
        <TabsContent value="api-keys">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">API Keys</h2>
              <p className="text-gray-600 mb-6">
                Configure API keys to enable functionality like address autocompletion and more.
              </p>
            </div>
            
            <GoogleApiKeyForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

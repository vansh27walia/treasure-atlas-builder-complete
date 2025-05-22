
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';
import { Card } from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="pickup-addresses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <PickupAddressSettings />
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


import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PickupAddressSettings from '@/components/settings/PickupAddressSettings';

const SettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="pickup-addresses" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pickup-addresses">Pickup Addresses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pickup-addresses">
          <PickupAddressSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

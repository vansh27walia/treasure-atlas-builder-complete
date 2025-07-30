
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedShippingFormV2 from '@/components/shipping/EnhancedShippingFormV2';
import InternationalShippingPage from './InternationalShippingPage';
import { Truck, Globe, Package } from 'lucide-react';

const CreateLabelPage = () => {
  const [activeTab, setActiveTab] = useState('domestic');

  const handleRatesReceived = (rates: any[], shipmentId: string) => {
    console.log('Rates received:', rates);
    console.log('Shipment ID:', shipmentId);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Shipping Label</h1>
          <p className="text-gray-600">Choose your shipping type and get the best rates</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="domestic" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Domestic Shipping
            </TabsTrigger>
            <TabsTrigger value="international" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              International Shipping
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domestic" className="mt-0">
            <EnhancedShippingFormV2 onRatesReceived={handleRatesReceived} />
          </TabsContent>

          <TabsContent value="international" className="mt-0">
            <InternationalShippingPage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CreateLabelPage;

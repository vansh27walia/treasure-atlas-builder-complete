
import React, { useState } from 'react';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package, Globe } from 'lucide-react';

const CreateLabelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('domestic');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create a Shipping Label</h1>
      
      <Card className="border-2 border-gray-200 p-6 mb-8">
        <Tabs defaultValue="domestic" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="domestic" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Domestic Shipping
            </TabsTrigger>
            <TabsTrigger value="international" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              International Shipping
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="domestic">
            <ShippingForm />
          </TabsContent>
          
          <TabsContent value="international">
            <div className="p-6 bg-blue-50 rounded-lg mb-6">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center mb-2">
                <Globe className="h-5 w-5 mr-2" />
                International Shipping
              </h2>
              <p className="text-blue-700">Use our international shipping form to send packages worldwide with customs forms automatically generated.</p>
            </div>
            
            <iframe 
              src="/international-shipping" 
              className="w-full border-0 min-h-[800px]" 
              title="International Shipping Form"
            />
          </TabsContent>
        </Tabs>
      </Card>

      {activeTab === 'domestic' && <ShippingRates />}
    </div>
  );
};

export default CreateLabelPage;

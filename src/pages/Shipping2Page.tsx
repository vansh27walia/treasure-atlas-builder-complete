
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Shipping2Sheet from '@/components/shipping/Shipping2Sheet';
import RateCalculator from '@/components/shipping/RateCalculator';
import ShippingRates from '@/components/ShippingRates';
import { useLocation } from 'react-router-dom';

const Shipping2Page: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tabParam = params.get('tab') || 'shipping2';

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Shipping 2</h1>
      
      <Tabs defaultValue={tabParam} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="shipping2">Shipping 2</TabsTrigger>
          <TabsTrigger value="calculator">Rate Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipping2" className="w-full">
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6">
              <Shipping2Sheet />
            </Card>
            
            <ShippingRates />
          </div>
        </TabsContent>
        
        <TabsContent value="calculator">
          <Card className="p-6">
            <RateCalculator />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Shipping2Page;


import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm'; 
import ShippingRates from '@/components/ShippingRates';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import { Globe, Package, Truck } from 'lucide-react';

const InternationalShippingV2 = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-blue-800 flex items-center">
        <Globe className="mr-2 h-7 w-7 text-blue-600" />
        International Shipping V2
      </h1>
      <p className="text-gray-600 mb-6">
        Ship packages to over 200 countries worldwide with our international shipping services.
      </p>

      <div className="mb-8">
        <ShippingWorkflow currentStep="address" />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-md rounded-xl overflow-hidden">
          <Tabs defaultValue="shipping" className="w-full">
            <div className="bg-blue-50 border-b border-blue-100">
              <div className="px-6 py-3">
                <TabsList className="grid grid-cols-2 h-11">
                  <TabsTrigger value="shipping" className="text-base font-medium">
                    <Package className="mr-2 h-5 w-5" />
                    Ship a Package
                  </TabsTrigger>
                  <TabsTrigger value="calculator" className="text-base font-medium">
                    <Truck className="mr-2 h-5 w-5" />
                    Rate Calculator
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            
            <div className="p-6">
              <TabsContent value="shipping">
                {/* Use EnhancedShippingForm without any props as they're not defined in the component */}
                <EnhancedShippingForm />
              </TabsContent>
              <TabsContent value="calculator">
                <div className="py-4">
                  {/* Use EnhancedShippingForm without any props */}
                  <EnhancedShippingForm />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
        
        {/* Shipping rates will be dynamically loaded when rates are fetched */}
        <ShippingRates />
      </div>
    </div>
  );
};

export default InternationalShippingV2;

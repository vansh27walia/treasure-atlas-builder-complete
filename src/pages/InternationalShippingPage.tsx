
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Globe, AlertCircle, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const InternationalShippingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('document');
  const form = useForm();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Globe className="mr-3 h-8 w-8 text-blue-600" /> 
          International Shipping
        </h1>
      </div>

      <Alert className="mb-6 bg-blue-50 border border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-800">International Shipping Information</AlertTitle>
        <AlertDescription className="text-blue-700">
          Ship to over 200+ countries worldwide with our international shipping services. Make sure to provide accurate customs information and review carrier-specific requirements.
        </AlertDescription>
      </Alert>

      <Card className="p-6 border-2 border-gray-200 mb-8">
        <Tabs defaultValue="document" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="document">Ship Documents</TabsTrigger>
            <TabsTrigger value="package">Ship Packages</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">Ship Documents Internationally</h2>
              <p className="text-gray-600">Use this option for shipping letters, documents, and flat envelopes.</p>
            </div>

            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Under Development</AlertTitle>
              <AlertDescription>
                The international document shipping functionality is currently being implemented and will be available soon.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form className="space-y-6">
                {/* Form fields will be added here */}
                <div className="text-center">
                  <Button disabled type="submit" className="w-full md:w-auto">
                    Coming Soon
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="package">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">Ship Packages Internationally</h2>
              <p className="text-gray-600">Use this option for shipping boxes and parcels that aren't flat documents.</p>
            </div>

            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Under Development</AlertTitle>
              <AlertDescription>
                The international package shipping functionality is currently being implemented and will be available soon.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form className="space-y-6">
                {/* Form fields will be added here */}
                <div className="text-center">
                  <Button disabled type="submit" className="w-full md:w-auto">
                    Coming Soon
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">International Coverage</h3>
          <p className="text-gray-600 mb-2">Ship to over 200 countries and territories worldwide with our reliable international shipping services.</p>
        </Card>
        
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Customs Information</h3>
          <p className="text-gray-600 mb-2">Proper customs documentation is required for all international shipments. We'll guide you through the process.</p>
        </Card>
        
        <Card className="p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Carrier Options</h3>
          <p className="text-gray-600 mb-2">Compare rates and services from USPS, UPS, DHL, and FedEx for your international shipping needs.</p>
        </Card>
      </div>
    </div>
  );
};

export default InternationalShippingPage;

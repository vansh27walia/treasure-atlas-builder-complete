
import React, { useState } from 'react';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package, Globe, Upload, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CreateLabelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('domestic');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Package className="mr-3 h-8 w-8 text-blue-600" />
        Create a Shipping Label
      </h1>
      
      <Card className="border-2 border-gray-200 shadow-md p-6 mb-8 bg-white rounded-xl">
        <Tabs defaultValue="domestic" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-blue-50 p-1 rounded-lg">
            <TabsTrigger 
              value="domestic" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Domestic
            </TabsTrigger>
            <TabsTrigger 
              value="international" 
              className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              <Globe className="h-4 w-4" />
              International
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
            >
              <Upload className="h-4 w-4" />
              Bulk Shipping
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="domestic">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 border border-blue-100 shadow-sm">
              <h2 className="text-xl font-semibold text-blue-800 flex items-center mb-2">
                <Truck className="h-5 w-5 mr-2 text-blue-600" />
                Domestic Shipping
              </h2>
              <p className="text-blue-700">Ship packages within the country with our various carrier options.</p>
            </div>
            <ShippingForm />
          </TabsContent>
          
          <TabsContent value="international">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-6 border border-indigo-100 shadow-sm">
              <h2 className="text-xl font-semibold text-indigo-800 flex items-center mb-2">
                <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                International Shipping
              </h2>
              <p className="text-indigo-700">Send packages worldwide with customs forms automatically generated.</p>
            </div>
            
            <div className="flex justify-center items-center py-10 px-4">
              <div className="text-center max-w-md">
                <Globe className="h-16 w-16 mx-auto text-indigo-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">International Shipping</h3>
                <p className="text-gray-600 mb-6">
                  Ship to over 200+ countries with our international shipping service, including automated customs documentation.
                </p>
                <Link to="/international">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Go to International Shipping
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="bulk">
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-6 border border-amber-100 shadow-sm">
              <h2 className="text-xl font-semibold text-amber-800 flex items-center mb-2">
                <Upload className="h-5 w-5 mr-2 text-amber-600" />
                Bulk Shipping
              </h2>
              <p className="text-amber-700">Upload CSV files to process multiple shipments at once.</p>
            </div>
            
            <div className="flex justify-center items-center py-10 px-4">
              <div className="text-center max-w-md">
                <Upload className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bulk Upload Shipping</h3>
                <p className="text-gray-600 mb-6">
                  Process multiple shipments at once by uploading a CSV file with all your shipping details.
                </p>
                <Link to="/bulk-upload">
                  <Button className="bg-amber-600 hover:bg-amber-700">
                    Go to Bulk Upload
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {activeTab === 'domestic' && <ShippingRates />}
    </div>
  );
};

export default CreateLabelPage;

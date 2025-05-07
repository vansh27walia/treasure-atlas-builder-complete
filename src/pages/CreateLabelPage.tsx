
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';
import RateCalculator from '@/components/shipping/RateCalculator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package, Globe, Upload, Truck, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CreateLabelPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || 'domestic');

  // Update the URL when tab changes
  useEffect(() => {
    if (activeTab) {
      queryParams.set('tab', activeTab);
      navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
    }
  }, [activeTab, location.pathname, navigate]);

  // Handle tab change from URL
  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-800 flex items-center">
        <Package className="mr-2 h-6 w-6 text-blue-600" />
        Create a Shipping Label
      </h1>
      
      <Card className="border border-gray-200 shadow-md mb-6 bg-white rounded-lg overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-4 bg-gray-100 rounded-none border-b p-0">
            <TabsTrigger 
              value="domestic" 
              className="py-3 rounded-none data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=active]:shadow-none"
            >
              <Package className="h-4 w-4 mr-1.5" />
              Domestic
            </TabsTrigger>
            <TabsTrigger 
              value="international" 
              className="py-3 rounded-none data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=active]:shadow-none"
            >
              <Globe className="h-4 w-4 mr-1.5" />
              International
            </TabsTrigger>
            <TabsTrigger 
              value="calculator" 
              className="py-3 rounded-none data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=active]:shadow-none"
            >
              <Calculator className="h-4 w-4 mr-1.5" />
              Rate Calculator
            </TabsTrigger>
            <TabsTrigger 
              value="bulk" 
              className="py-3 rounded-none data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-blue-600 data-[state=active]:shadow-none"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              Bulk Shipping
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="domestic" className="pt-2 pb-4 px-6 mt-0">
            <div className="p-4 bg-blue-50 rounded-md mb-4 border border-blue-100">
              <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-1">
                <Truck className="h-4 w-4 mr-2 text-blue-600" />
                Domestic Shipping
              </h2>
              <p className="text-sm text-blue-700">Ship packages within the country with our various carrier options.</p>
            </div>
            <ShippingForm />
          </TabsContent>
          
          <TabsContent value="international" className="pt-2 pb-4 px-6 mt-0">
            <div className="p-4 bg-indigo-50 rounded-md mb-4 border border-indigo-100">
              <h2 className="text-lg font-semibold text-indigo-800 flex items-center mb-1">
                <Globe className="h-4 w-4 mr-2 text-indigo-600" />
                International Shipping
              </h2>
              <p className="text-sm text-indigo-700">Send packages worldwide with customs forms automatically generated.</p>
            </div>
            
            <div className="flex justify-center items-center py-8 px-4">
              <div className="text-center max-w-md">
                <Globe className="h-12 w-12 mx-auto text-indigo-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">International Shipping</h3>
                <p className="text-gray-600 mb-4 text-sm">
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
          
          <TabsContent value="calculator" className="pt-2 pb-4 px-6 mt-0">
            <div className="p-4 bg-green-50 rounded-md mb-4 border border-green-100">
              <h2 className="text-lg font-semibold text-green-800 flex items-center mb-1">
                <Calculator className="h-4 w-4 mr-2 text-green-600" />
                Shipping Rate Calculator
              </h2>
              <p className="text-sm text-green-700">Calculate shipping rates for different carriers without creating a shipment.</p>
            </div>
            
            <RateCalculator />
          </TabsContent>
          
          <TabsContent value="bulk" className="pt-2 pb-4 px-6 mt-0">
            <div className="p-4 bg-amber-50 rounded-md mb-4 border border-amber-100">
              <h2 className="text-lg font-semibold text-amber-800 flex items-center mb-1">
                <Upload className="h-4 w-4 mr-2 text-amber-600" />
                Bulk Shipping
              </h2>
              <p className="text-sm text-amber-700">Upload CSV files to process multiple shipments at once.</p>
            </div>
            
            <div className="flex justify-center items-center py-8 px-4">
              <div className="text-center max-w-md">
                <Upload className="h-12 w-12 mx-auto text-amber-500 mb-3" />
                <h3 className="text-lg font-semibold mb-2">Bulk Upload Shipping</h3>
                <p className="text-gray-600 mb-4 text-sm">
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
      {activeTab === 'calculator' && <ShippingRates />}
    </div>
  );
};

export default CreateLabelPage;

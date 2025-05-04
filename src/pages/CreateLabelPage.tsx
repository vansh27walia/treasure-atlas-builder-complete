
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
import ShippingLabel from '@/components/shipping/ShippingLabel';
import { useShippingRates } from '@/hooks/useShippingRates';

const CreateLabelPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || 'domestic');
  const { labelUrl, trackingCode, shipmentId } = useShippingRates();

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800 flex items-center">
        <Package className="mr-3 h-8 w-8 text-blue-600" />
        Create a Shipping Label
      </h1>
      
      <Card className="border-2 border-gray-200 shadow-lg p-6 mb-8 bg-white rounded-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-blue-50 p-1 rounded-lg">
            <TabsTrigger 
              value="domestic" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4" />
              Domestic
            </TabsTrigger>
            <TabsTrigger 
              value="calculator" 
              className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <Calculator className="h-4 w-4" />
              Rate Calculator
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
            
            {labelUrl && trackingCode && (
              <div className="mb-6">
                <ShippingLabel 
                  labelUrl={labelUrl} 
                  trackingCode={trackingCode} 
                  shipmentId={shipmentId}
                />
              </div>
            )}
            
            <ShippingForm />
          </TabsContent>
          
          <TabsContent value="calculator">
            <div className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg mb-6 border border-green-100 shadow-sm">
              <h2 className="text-xl font-semibold text-green-800 flex items-center mb-2">
                <Calculator className="h-5 w-5 mr-2 text-green-600" />
                Shipping Rate Calculator
              </h2>
              <p className="text-green-700">Calculate shipping rates for different carriers without creating a shipment.</p>
            </div>
            
            <RateCalculator />
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
      {activeTab === 'calculator' && <ShippingRates />}
    </div>
  );
};

export default CreateLabelPage;

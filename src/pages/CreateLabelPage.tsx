import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShippingRates from '@/components/ShippingRates';
import RateCalculator from '@/components/shipping/RateCalculator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package, Globe, Upload, Truck, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';

const CreateLabelPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || 'domestic');
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates' | 'label' | 'complete'>('address');

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
  
  // Listen for custom events to update workflow step
  useEffect(() => {
    const handleStepChange = (event: CustomEvent<{step: 'address' | 'package' | 'rates' | 'label' | 'complete'}>) => {
      if (event.detail && event.detail.step) {
        setCurrentStep(event.detail.step);
      }
    };
    
    document.addEventListener('shipping-step-change', handleStepChange as EventListener);
    
    // Custom event listener for when shipping form is completed
    const handleFormCompleted = () => {
      setCurrentStep('rates');
    };
    
    document.addEventListener('shipping-form-completed', handleFormCompleted);
    
    // Custom event listener for when a rate is selected
    const handleRateSelected = () => {
      setCurrentStep('label');
    };
    
    document.addEventListener('rate-selected', handleRateSelected);
    
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
      document.removeEventListener('shipping-form-completed', handleFormCompleted);
      document.removeEventListener('rate-selected', handleRateSelected);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800 flex items-center">
            <Package className="mr-3 h-7 w-7 text-blue-600" />
            Create a Shipping Label
          </h1>
        </div>
      
        {/* Floating workflow steps */}
        <div className="sticky top-0 z-20 bg-white py-3 shadow-sm rounded-lg mb-4">
          <div className="max-w-7xl mx-auto px-4">
            <ShippingWorkflow currentStep={currentStep} />
          </div>
        </div>
        
        <Card className="border border-gray-200 shadow-lg bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 bg-blue-50 p-1">
              <TabsTrigger 
                value="domestic" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                onClick={() => setCurrentStep('address')}
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
                value="calculator" 
                className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                <Calculator className="h-4 w-4" />
                Rate Calculator
              </TabsTrigger>
              <TabsTrigger 
                value="bulk" 
                className="flex items-center gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <Upload className="h-4 w-4" />
                Bulk Shipping
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="domestic" className="p-4">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-4 border border-blue-100">
                <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  Domestic Shipping
                </h2>
                <p className="text-blue-700 text-sm">Ship packages within the country with our various carrier options.</p>
              </div>
              <EnhancedShippingForm />
            </TabsContent>
            
            <TabsContent value="international" className="p-4">
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-4 border border-indigo-100">
                <h2 className="text-lg font-semibold text-indigo-800 flex items-center mb-2">
                  <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                  International Shipping
                </h2>
                <p className="text-indigo-700 text-sm">Send packages worldwide with customs forms automatically generated.</p>
              </div>
              
              <div className="flex justify-center items-center py-8">
                <div className="text-center max-w-md">
                  <Globe className="h-12 w-12 mx-auto text-indigo-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">International Shipping</h3>
                  <p className="text-gray-600 mb-6 text-sm">
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
            
            <TabsContent value="calculator" className="p-4">
              <div className="p-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg mb-4 border border-green-100">
                <h2 className="text-lg font-semibold text-green-800 flex items-center mb-2">
                  <Calculator className="h-5 w-5 mr-2 text-green-600" />
                  Shipping Rate Calculator
                </h2>
                <p className="text-green-700 text-sm">Calculate shipping rates for different carriers without creating a shipment.</p>
              </div>
              
              <RateCalculator />
            </TabsContent>
            
            <TabsContent value="bulk" className="p-4">
              <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg mb-4 border border-amber-100">
                <h2 className="text-lg font-semibold text-amber-800 flex items-center mb-2">
                  <Upload className="h-5 w-5 mr-2 text-amber-600" />
                  Bulk Shipping
                </h2>
                <p className="text-amber-700 text-sm">Upload CSV files to process multiple shipments at once.</p>
              </div>
              
              <div className="flex justify-center items-center py-8">
                <div className="text-center max-w-md">
                  <Upload className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Bulk Upload Shipping</h3>
                  <p className="text-gray-600 mb-6 text-sm">
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

        {(activeTab === 'domestic' || activeTab === 'calculator') && (
          <div className="mt-4">
            <ShippingRates />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateLabelPage;

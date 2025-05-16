
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

const InternationalShippingSecond: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const tabFromQuery = queryParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromQuery || 'international');
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
    <div className="w-full py-6 px-6">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800 flex items-center">
            <Globe className="mr-3 h-7 w-7 text-blue-600" />
            International Shipping (Second)
          </h1>
        </div>
      </div>
      
      {/* Floating workflow steps */}
      <div className="sticky top-0 z-20 bg-white py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <ShippingWorkflow currentStep={currentStep} />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <Card className="border border-gray-200 shadow-md bg-white rounded-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-4 bg-blue-50 p-1 rounded-lg">
              <TabsTrigger 
                value="international" 
                className="flex items-center gap-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                <Globe className="h-4 w-4" />
                International Shipping Second
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="international">
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-4 border border-indigo-100 shadow-sm">
                <h2 className="text-lg font-semibold text-indigo-800 flex items-center mb-2">
                  <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                  International Shipping (Second)
                </h2>
                <p className="text-indigo-700 text-sm">Send packages worldwide with customs forms automatically generated.</p>
              </div>
              
              <EnhancedShippingForm />
            </TabsContent>
          </Tabs>
        </Card>

        {activeTab === 'international' && <ShippingRates />}
      </div>
    </div>
  );
};

export default InternationalShippingSecond;


import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, Globe, FileText, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';

const ShippingToPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates' | 'label' | 'complete'>('address');
  const [activeTab, setActiveTab] = useState('individual');
  
  // Listen for custom events to update workflow step
  React.useEffect(() => {
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
    
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
      document.removeEventListener('shipping-form-completed', handleFormCompleted);
    };
  }, []);
  
  const handleBulkUploadClick = () => {
    navigate('/bulk-upload');
  };
  
  return (
    <div className="w-full py-6 px-6">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800 flex items-center">
            <Globe className="mr-3 h-7 w-7 text-blue-600" />
            Ship Packages To
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Individual Shipment
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Bulk Shipments
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual">
            <Card className="border border-gray-200 shadow-md bg-white rounded-lg p-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-8 border border-blue-100 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                  <Truck className="h-5 w-5 mr-2 text-blue-600" />
                  Ship Individual Package
                </h2>
                <p className="text-blue-700 text-sm">Create and print shipping labels with competitive rates and automated documentation.</p>
              </div>
              
              <EnhancedShippingForm />
            </Card>
          </TabsContent>
          
          <TabsContent value="bulk">
            <Card className="border border-gray-200 shadow-md bg-white rounded-lg p-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-8 border border-blue-100 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Ship Multiple Packages
                </h2>
                <p className="text-blue-700 text-sm">Upload a CSV file with multiple recipients and create labels in bulk.</p>
              </div>
              
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Bulk Upload Shipping</h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  Process multiple shipments simultaneously using our bulk upload tool.
                  Upload a CSV file with recipient details and create all your labels at once.
                </p>
                <Button 
                  onClick={handleBulkUploadClick}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-6"
                >
                  <FileText className="h-4 w-4" />
                  Go to Bulk Upload
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ShippingToPage;

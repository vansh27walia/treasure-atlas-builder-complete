
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Globe, Package, ArrowLeft, AlertCircle, Check, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { carrierService } from '@/services/CarrierService';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import InternationalShippingForm from '@/components/shipping/InternationalShippingForm';
import CustomsInfoForm from '@/components/shipping/CustomsInfoForm';
import ShippingRates from '@/components/ShippingRates';
import { useShippingRates } from '@/hooks/useShippingRates';

const ShippingTooPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('boxShipping');
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates' | 'label' | 'complete'>('address');
  const [showRates, setShowRates] = useState(false);
  const [formData, setFormData] = useState(null);
  const [customsData, setCustomsData] = useState(null);
  
  const {
    rates,
    shipmentId,
    labelUrl,
    trackingCode
  } = useShippingRates();

  useEffect(() => {
    // Reset workflow
    setCurrentStep('address');
    setShowRates(false);
  }, []);

  // Effect to update step when label is created
  useEffect(() => {
    if (labelUrl) {
      setCurrentStep('complete');
    }
  }, [labelUrl]);

  const handleShippingFormSubmit = (data: any) => {
    setFormData(data);
    setCurrentStep('package'); // This matches the ShippingStep type in shipping.ts
    toast({
      description: "Address information saved. Please complete customs information next",
      icon: <Check className="h-4 w-4" />
    });
  };

  const handleCustomsFormSubmit = (data: any) => {
    setCustomsData(data);
    setCurrentStep('rates');
    setShowRates(true);
    toast({
      description: "Customs information saved. Fetching shipping rates...",
      icon: <Check className="h-4 w-4" />
    });
  };

  const handleBackToEditForm = () => {
    setCurrentStep('address');
    setShowRates(false);
  };

  const handleBackToCustomsForm = () => {
    setCurrentStep('package');
    setShowRates(false);
  };

  return (
    <div className="w-full py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-800 flex items-center">
            <Package className="mr-3 h-7 w-7 text-blue-600" />
            Shipping Too - Box Shipping
          </h1>
          <p className="text-gray-600">Ship boxes internationally with automatic customs forms generation.</p>
        </div>
        
        {/* Workflow steps */}
        <div className="sticky top-0 z-20 bg-white py-4 border-b mb-6">
          <ShippingWorkflow 
            currentStep={currentStep}
          />
        </div>
        
        <Card className="mb-8 border border-gray-200 shadow-md">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-muted grid grid-cols-1">
              <TabsTrigger value="boxShipping" className="flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Box Shipping
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="boxShipping" className="p-4">
              {currentStep === 'address' && (
                <div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 border border-blue-100">
                    <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
                      <Globe className="h-5 w-5 mr-2 text-blue-600" />
                      Address Information
                    </h2>
                    <p className="text-blue-700 text-sm">
                      Enter the shipping details for your international package.
                    </p>
                  </div>
                  
                  <Alert className="mb-6 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Important</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      International shipments require complete and accurate address information. Make sure to provide the correct postal code and phone number.
                    </AlertDescription>
                  </Alert>
                  
                  <InternationalShippingForm onSubmit={handleShippingFormSubmit} initialData={formData} />
                </div>
              )}
              
              {currentStep === 'package' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <Button 
                      variant="outline"
                      onClick={handleBackToEditForm}
                      className="flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Address
                    </Button>
                    <h2 className="text-lg font-semibold text-blue-800">Customs Information</h2>
                  </div>
                  
                  <Alert className="mb-6 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Customs Declaration Required</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      International shipments require customs declaration. Provide accurate item descriptions, values, and country of origin.
                    </AlertDescription>
                  </Alert>
                  
                  <CustomsInfoForm onSubmit={handleCustomsFormSubmit} initialData={customsData} />
                </div>
              )}
              
              {currentStep === 'rates' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <Button 
                      variant="outline"
                      onClick={handleBackToCustomsForm}
                      className="flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Customs
                    </Button>
                    <h2 className="text-lg font-semibold text-blue-800 flex items-center">
                      <Truck className="mr-2 h-5 w-5" />
                      Select Shipping Rate
                    </h2>
                  </div>
                  
                  <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">International Rates</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Compare rates from multiple carriers for your international shipment. Transit times are estimated and may vary.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {currentStep === 'complete' && labelUrl && (
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Shipping Label Created!</h2>
                  <p className="text-gray-600 mb-6">
                    Your international shipping label has been successfully created. You can download it below.
                  </p>
                  
                  <div className="flex flex-col space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h3 className="font-medium text-gray-800 mb-1">Tracking Information</h3>
                      <p className="text-gray-600 mb-2">Tracking number: <span className="font-mono">{trackingCode}</span></p>
                      
                      <Button 
                        onClick={() => {
                          // Open label in new window
                          window.open(labelUrl, '_blank');
                        }}
                        className="w-full mt-2"
                      >
                        Download Shipping Label
                      </Button>
                    </div>
                    
                    <div className="flex space-x-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setCurrentStep('address');
                          setShowRates(false);
                          setFormData(null);
                          setCustomsData(null);
                        }}
                      >
                        Create Another Label
                      </Button>
                      
                      <Button 
                        className="flex-1"
                        onClick={() => navigate('/tracking')}
                      >
                        Track Shipment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
        
        {showRates && (
          <ShippingRates />
        )}
      </div>
    </div>
  );
};

export default ShippingTooPage;

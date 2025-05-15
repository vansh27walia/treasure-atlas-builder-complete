
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import ShippingRates from '@/components/ShippingRates';
import { useShippingRates } from '@/hooks/useShippingRates';
import { toast } from '@/hooks/use-toast';

// Import the step components
import AddressStep from '@/components/shipping/steps/AddressStep';
import CustomsStep from '@/components/shipping/steps/CustomsStep';
import RatesStep from '@/components/shipping/steps/RatesStep';
import CompleteStep from '@/components/shipping/steps/CompleteStep';

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
    trackingCode,
    resetShippingState
  } = useShippingRates();

  useEffect(() => {
    // Reset workflow
    setCurrentStep('address');
    setShowRates(false);
    resetShippingState();
  }, []);

  // Effect to update step when label is created
  useEffect(() => {
    if (labelUrl) {
      setCurrentStep('complete');
    }
  }, [labelUrl]);

  const handleShippingFormSubmit = (data: any) => {
    setFormData(data);
    setCurrentStep('package');
    toast({
      title: "Address Saved",
      description: "Address information saved. Please complete customs information next",
    });
  };

  const handleCustomsFormSubmit = (data: any) => {
    setCustomsData(data);
    setCurrentStep('rates');
    setShowRates(true);
    toast({
      title: "Customs Information Saved",
      description: "Customs information saved. Fetching shipping rates...",
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

  const handleResetShipping = () => {
    setCurrentStep('address');
    setShowRates(false);
    setFormData(null);
    setCustomsData(null);
    resetShippingState();
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
                <AddressStep 
                  onSubmit={handleShippingFormSubmit}
                  formData={formData}
                />
              )}
              
              {currentStep === 'package' && (
                <CustomsStep
                  onSubmit={handleCustomsFormSubmit}
                  onBack={handleBackToEditForm}
                  initialData={customsData}
                />
              )}
              
              {currentStep === 'rates' && (
                <RatesStep
                  onBack={handleBackToCustomsForm}
                />
              )}
              
              {currentStep === 'complete' && labelUrl && (
                <CompleteStep
                  labelUrl={labelUrl}
                  trackingCode={trackingCode}
                  onResetShipping={handleResetShipping}
                />
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


import React from 'react';
import { Helmet } from 'react-helmet-async';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import ShippingRates from '@/components/ShippingRates';
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from 'lucide-react';
import { ShippingStep } from '@/types/shipping';

const InternationalShippingV2: React.FC = () => {
  const [step, setStep] = React.useState<ShippingStep>('address');
  
  React.useEffect(() => {
    const handleStepChange = (event: CustomEvent<{step: string}>) => {
      if (event.detail && event.detail.step) {
        setStep(event.detail.step as ShippingStep);
      }
    };
    
    document.addEventListener('shipping-step-change', handleStepChange as EventListener);
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
    };
  }, []);

  return (
    <div className="container px-4 py-8 mx-auto">
      <Helmet>
        <title>International Shipping V2 | Shipper</title>
      </Helmet>
      
      <div className="flex items-center mb-6">
        <Globe className="h-8 w-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">International Shipping V2</h1>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <ShippingWorkflow currentStep={step} />
        </CardContent>
      </Card>
      
      {step === 'address' && (
        <Card>
          <CardContent className="p-6">
            <EnhancedShippingForm />
          </CardContent>
        </Card>
      )}
      
      {(step === 'rates' || step === 'label' || step === 'complete') && (
        <ShippingRates />
      )}
    </div>
  );
};

export default InternationalShippingV2;

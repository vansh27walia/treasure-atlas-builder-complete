
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Package, Truck, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import ShippingWorkflow from '@/components/shipping/ShippingWorkflow';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';

const ShippingToPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'address' | 'package' | 'rates' | 'label' | 'complete'>('address');
  
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
        <Card className="border border-gray-200 shadow-md bg-white rounded-lg p-6">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-8 border border-blue-100 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-800 flex items-center mb-2">
              <Truck className="h-5 w-5 mr-2 text-blue-600" />
              Ship Packages To Your Destination
            </h2>
            <p className="text-blue-700 text-sm">Send packages internationally with automated customs documentation and competitive rates.</p>
          </div>
          
          {/* Remove isInternational prop if not supported by EnhancedShippingForm */}
          <EnhancedShippingForm />
        </Card>
      </div>
    </div>
  );
};

export default ShippingToPage;

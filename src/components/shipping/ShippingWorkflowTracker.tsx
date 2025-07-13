
import React from 'react';
import { Check, MapPin, Package, CreditCard, FileText, CheckCircle } from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'upcoming';
}

interface ShippingWorkflowTrackerProps {
  currentStep: string;
}

const ShippingWorkflowTracker: React.FC<ShippingWorkflowTrackerProps> = ({ currentStep }) => {
  const steps: WorkflowStep[] = [
    { id: 'address', label: 'Addresses', icon: MapPin, status: 'completed' },
    { id: 'package', label: 'Package', icon: Package, status: currentStep === 'package' ? 'active' : currentStep === 'rates' || currentStep === 'payment' || currentStep === 'complete' ? 'completed' : 'upcoming' },
    { id: 'rates', label: 'Rates', icon: FileText, status: currentStep === 'rates' ? 'active' : currentStep === 'payment' || currentStep === 'complete' ? 'completed' : 'upcoming' },
    { id: 'payment', label: 'Payment', icon: CreditCard, status: currentStep === 'payment' ? 'active' : currentStep === 'complete' ? 'completed' : 'upcoming' },
    { id: 'complete', label: 'Complete', icon: CheckCircle, status: currentStep === 'complete' ? 'completed' : 'upcoming' },
  ];

  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                  ${step.status === 'completed' 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step.status === 'active'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    step.status === 'active' ? 'text-blue-600' : 
                    step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${
                  step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShippingWorkflowTracker;

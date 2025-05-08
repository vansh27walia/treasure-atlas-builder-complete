
import React from 'react';
import { CheckCircle, Circle, MapPin, Package, Truck, FileCheck, ArrowRight } from 'lucide-react';

type Step = 'address' | 'package' | 'rates' | 'label' | 'complete';

interface ShippingWorkflowProps {
  currentStep: Step;
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStep }) => {
  const steps = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'package', label: 'Package Info', icon: Package },
    { id: 'rates', label: 'Select Rate', icon: Truck },
    { id: 'label', label: 'Get Label', icon: FileCheck },
    { id: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-white shadow-sm rounded-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap justify-between items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const StepIcon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                    ${status === 'completed' ? 'bg-green-100 text-green-600' : 
                      status === 'active' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span 
                  className={`text-xs font-medium 
                    ${status === 'completed' ? 'text-green-600' : 
                      status === 'active' ? 'text-blue-600' : 
                      'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center">
                  <ArrowRight className={`h-4 w-4 mx-2 ${status === 'completed' ? 'text-green-500' : 'text-gray-300'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingWorkflow;

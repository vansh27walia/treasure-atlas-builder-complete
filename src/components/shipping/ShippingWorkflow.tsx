
import React from 'react';
import { CheckCircle, Circle, MapPin, Package, Truck, FileCheck } from 'lucide-react';

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
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md rounded-lg border border-blue-200 p-4 mb-6">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const StepIcon = step.icon;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all duration-300
                    ${status === 'completed' ? 'bg-green-100 text-green-600 ring-2 ring-green-400' : 
                      status === 'active' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 scale-110' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span 
                  className={`text-xs font-medium 
                    ${status === 'completed' ? 'text-green-600' : 
                      status === 'active' ? 'text-blue-700 font-bold' : 
                      'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center">
                  <div className={`h-1 w-6 md:w-12 lg:w-16 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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


import React from 'react';
import { CheckCircle, Circle, MapPin, Package, Truck, FileCheck } from 'lucide-react';
import { ShippingWorkflowStep, ShippingStep } from '@/types/shipping';

interface ShippingWorkflowProps {
  currentStep: ShippingStep;
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStep }) => {
  const steps: ShippingWorkflowStep[] = [
    { id: 'address', label: 'Address', status: 'upcoming' },
    { id: 'package', label: 'Package Info', status: 'upcoming' },
    { id: 'rates', label: 'Select Rate', status: 'upcoming' },
    { id: 'label', label: 'Get Label', status: 'upcoming' },
    { id: 'complete', label: 'Complete', status: 'upcoming' },
  ];

  // Update steps based on currentStep
  steps.forEach((step, index) => {
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);
    
    if (index < currentStepIndex) {
      step.status = 'completed';
    } else if (index === currentStepIndex) {
      step.status = 'active';
    } else {
      step.status = 'upcoming';
    }
  });

  const getStepIcon = (step: ShippingWorkflowStep) => {
    switch (step.id) {
      case 'address':
        return MapPin;
      case 'package':
        return Package;
      case 'rates':
        return Truck;
      case 'label':
        return FileCheck;
      case 'complete':
        return CheckCircle;
      default:
        return Circle;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-100 p-4 mb-4 shadow-sm sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const StepIcon = getStepIcon(step);
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300
                    ${step.status === 'completed' ? 'bg-green-100 text-green-600 ring-1 ring-green-400' : 
                      step.status === 'active' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 scale-110' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                  data-step-id={step.id}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span 
                  className={`text-xs font-medium 
                    ${step.status === 'completed' ? 'text-green-600' : 
                      step.status === 'active' ? 'text-blue-700 font-bold' : 
                      'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block flex-grow mx-2">
                  <div className={`h-0.5 w-full ${step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
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

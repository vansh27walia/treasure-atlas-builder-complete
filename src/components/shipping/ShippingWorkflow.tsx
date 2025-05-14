import React from 'react';
import { CheckCircle, Package, Truck, FileText, MapPin } from 'lucide-react';

interface ShippingWorkflowProps {
  currentStep: 'address' | 'package' | 'rates' | 'label' | 'complete';
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStep }) => {
  const steps = [
    { id: 'address', label: 'Address', icon: <MapPin className="h-5 w-5" /> },
    { id: 'package', label: 'Package', icon: <Package className="h-5 w-5" /> },
    { id: 'rates', label: 'Rates', icon: <Truck className="h-5 w-5" /> },
    { id: 'label', label: 'Label', icon: <FileText className="h-5 w-5" /> },
    { id: 'complete', label: 'Complete', icon: <CheckCircle className="h-5 w-5" /> },
  ];

  // Helper function to determine if a step is completed
  const isCompleted = (stepId: string) => {
    const stepOrder = { address: 1, package: 2, rates: 3, label: 4, complete: 5 };
    return stepOrder[stepId as keyof typeof stepOrder] < stepOrder[currentStep];
  };

  // Helper function to determine if a step is active
  const isActive = (stepId: string) => stepId === currentStep;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step circle with icon */}
            <div className="flex flex-col items-center">
              <div 
                className={`flex items-center justify-center h-10 w-10 rounded-full transition-all
                  ${isCompleted(step.id) 
                    ? 'bg-green-500 text-white bg-opacity-80' 
                    : isActive(step.id)
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-gray-200 text-gray-500 bg-opacity-70'}`}
              >
                {isCompleted(step.id) ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>
              <span 
                className={`mt-2 text-xs font-medium 
                  ${isCompleted(step.id) 
                    ? 'text-green-700' 
                    : isActive(step.id)
                      ? 'text-blue-700' 
                      : 'text-gray-500'}`}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connecting line between steps */}
            {index < steps.length - 1 && (
              <div 
                className={`flex-1 h-0.5 mx-2
                  ${isCompleted(step.id) && isCompleted(steps[index + 1].id)
                    ? 'bg-green-500 bg-opacity-70'
                    : isCompleted(step.id) && isActive(steps[index + 1].id)
                      ? 'bg-blue-500 bg-opacity-70'
                      : 'bg-gray-200 bg-opacity-70'}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ShippingWorkflow;

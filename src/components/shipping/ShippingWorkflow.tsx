
import React from 'react';
import { CheckCircle, Circle, MapPin, Package as PackageIcon, Truck, FileCheck } from 'lucide-react'; // Renamed Package to PackageIcon
import { ShippingStep, ShippingWorkflowStep } from '@/types/shipping'; // Ensure these types are correctly defined in types/shipping

interface ShippingWorkflowProps {
  currentStepId: ShippingStep; // Changed prop name for clarity
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStepId }) => {
  // Define steps based on ShippingWorkflowStep structure
  const stepsData: { id: ShippingStep; name: string; icon: React.ElementType }[] = [
    { id: 'address', name: 'Address', icon: MapPin },
    { id: 'parcel', name: 'Package Info', icon: PackageIcon }, // Use PackageIcon
    { id: 'rates', name: 'Select Rate', icon: Truck },
    { id: 'payment', name: 'Payment', icon: CheckCircle }, // Assuming payment is a step
    { id: 'label', name: 'Get Label', icon: FileCheck },
  ];
  
  const currentStepIndex = stepsData.findIndex(s => s.id === currentStepId);

  const workflowSteps: ShippingWorkflowStep[] = stepsData.map((step, index) => {
    let status: ShippingWorkflowStep['status'] = 'upcoming';
    if (index < currentStepIndex) {
      status = 'complete';
    } else if (index === currentStepIndex) {
      status = 'current';
    }
    return { id: step.id, name: step.name, status };
  });


  return (
    <div className="w-full bg-white rounded-lg border border-gray-100 p-4 mb-4 shadow-sm sticky top-0 z-30">
      <div className="flex justify-between items-center">
        {workflowSteps.map((step, index) => {
          const StepIcon = stepsData.find(s => s.id === step.id)?.icon || Circle;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center text-center w-1/5"> {/* Equal width for steps */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 transition-all duration-300
                    ${step.status === 'complete' ? 'bg-green-100 text-green-600 ring-1 ring-green-400' : 
                      step.status === 'current' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 scale-110' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                  data-step-id={step.id}
                >
                  <StepIcon className="h-5 w-5" />
                </div>
                <span 
                  className={`text-xs font-medium leading-tight
                    ${step.status === 'complete' ? 'text-green-600' : 
                      step.status === 'current' ? 'text-blue-700 font-bold' : 
                      'text-gray-400'}
                  `}
                >
                  {step.name}
                </span>
              </div>
              
              {index < workflowSteps.length - 1 && (
                <div className="hidden md:block flex-grow mx-1 lg:mx-2 self-center" style={{ transform: 'translateY(-0.75rem)'}}> {/* Align with icon center */}
                  <div className={`h-0.5 w-full ${step.status === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
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


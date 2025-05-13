
import React from 'react';
import { Package, MapPin, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { ShippingStep, ShippingWorkflowStep } from '@/types/shipping';

interface ShippingWorkflowProps {
  currentStep: ShippingStep;
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStep }) => {
  // Define workflow steps
  const steps: ShippingWorkflowStep[] = [
    {
      id: 'address',
      label: 'Address',
      status: currentStep === 'address' ? 'active' : 
              (currentStep === 'package' || currentStep === 'rates' || currentStep === 'label' || currentStep === 'complete') ? 'completed' : 'upcoming'
    },
    {
      id: 'package',
      label: 'Package',
      status: currentStep === 'package' ? 'active' : 
              (currentStep === 'rates' || currentStep === 'label' || currentStep === 'complete') ? 'completed' : 'upcoming'
    },
    {
      id: 'rates',
      label: 'Shipping Rates',
      status: currentStep === 'rates' ? 'active' : 
              (currentStep === 'label' || currentStep === 'complete') ? 'completed' : 'upcoming'
    },
    {
      id: 'label',
      label: 'Label',
      status: currentStep === 'label' ? 'active' : 
              (currentStep === 'complete') ? 'completed' : 'upcoming'
    },
    {
      id: 'complete',
      label: 'Complete',
      status: currentStep === 'complete' ? 'active' : 'upcoming'
    }
  ];

  // Get icon based on step
  const getStepIcon = (step: ShippingWorkflowStep) => {
    switch (step.id) {
      case 'address':
        return <MapPin className="h-4 w-4" />;
      case 'package':
        return <Package className="h-4 w-4" />;
      case 'rates':
        return <TrendingUp className="h-4 w-4" />;
      case 'label':
        return <FileText className="h-4 w-4" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="w-full py-2 border-b border-gray-200">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          // Determine step color based on status
          let stepColor = 'text-gray-400 border-gray-200';
          let bgColor = 'bg-gray-50';
          let iconColor = 'text-gray-400';
          
          if (step.status === 'active') {
            stepColor = 'text-blue-600 border-blue-500 font-medium';
            bgColor = 'bg-blue-50';
            iconColor = 'text-blue-600';
          } else if (step.status === 'completed') {
            stepColor = 'text-green-600 border-green-500';
            bgColor = 'bg-green-50';
            iconColor = 'text-green-600';
          }

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-8 h-8 ${bgColor} rounded-full border-2 ${stepColor} mb-1`}>
                  <span className={iconColor}>{getStepIcon(step)}</span>
                </div>
                <span className={`text-xs ${stepColor} hidden sm:block`}>
                  {step.label}
                </span>
              </div>
              
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className="flex-grow mx-1 h-0.5 bg-gray-200">
                  {step.status === 'completed' && (
                    <div className="h-full bg-green-500" style={{width: '100%'}}></div>
                  )}
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

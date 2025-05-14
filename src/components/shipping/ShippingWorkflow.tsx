
import React from 'react';
import { Check, Package, DollarSign, Truck, Printer, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingWorkflowProps {
  currentStep: 'address' | 'package' | 'rates' | 'label' | 'complete';
}

const ShippingWorkflow: React.FC<ShippingWorkflowProps> = ({ currentStep }) => {
  const steps = [
    {
      id: 'address',
      name: 'Address',
      icon: MapPin,
      status: currentStep === 'address' ? 'current' : 
              ['package', 'rates', 'label', 'complete'].includes(currentStep) ? 'complete' : 'upcoming'
    },
    {
      id: 'package',
      name: 'Package',
      icon: Package,
      status: currentStep === 'package' ? 'current' : 
              ['rates', 'label', 'complete'].includes(currentStep) ? 'complete' : 'upcoming'
    },
    {
      id: 'rates',
      name: 'Rates',
      icon: DollarSign,
      status: currentStep === 'rates' ? 'current' : 
              ['label', 'complete'].includes(currentStep) ? 'complete' : 'upcoming'
    },
    {
      id: 'label',
      name: 'Label',
      icon: Printer,
      status: currentStep === 'label' ? 'current' : 
              ['complete'].includes(currentStep) ? 'complete' : 'upcoming'
    },
    {
      id: 'complete',
      name: 'Complete',
      icon: Truck,
      status: currentStep === 'complete' ? 'current' : 'upcoming'
    }
  ];

  return (
    <div className="mb-6">
      <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400">
        {steps.map((step, index) => (
          <li 
            key={step.id} 
            className={cn(
              "flex flex-col items-center md:flex-row w-full",
              index < steps.length - 1 && "md:after:w-full md:after:h-0.5 md:after:bg-gray-200 md:after:border-0 after:inline-block after:mx-4"
            )}
          >
            <span className={cn(
              "flex items-center justify-center w-8 h-8 md:flex-shrink-0 border rounded-full transition-all",
              step.status === 'complete' && "bg-blue-600 text-white border-blue-600",
              step.status === 'current' && "border-blue-600 text-blue-600 border-[1px]",
              step.status === 'upcoming' && "border-gray-300 text-gray-500"
            )}>
              {step.status === 'complete' ? (
                <Check className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
            </span>
            <span className={cn(
              "mt-1 md:ml-2 text-xs md:text-sm font-medium",
              step.status === 'complete' && "text-blue-600",
              step.status === 'current' && "text-blue-600",
              step.status === 'upcoming' && "text-gray-500"
            )}>
              {step.name}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default ShippingWorkflow;

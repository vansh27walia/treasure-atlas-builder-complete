
import React from 'react';
import { Check, MapPin, Package, CreditCard, Truck, CheckCircle } from 'lucide-react';

interface ShippingWorkflowTrackerProps {
  currentStep: 'addresses' | 'package' | 'rates' | 'payment' | 'complete';
}

const steps = [
  {
    id: 'addresses',
    name: 'Addresses',
    description: 'Pickup & Drop-off',
    icon: MapPin,
    color: 'blue'
  },
  {
    id: 'package',
    name: 'Package',
    description: 'Type & Details',
    icon: Package,
    color: 'purple'
  },
  {
    id: 'rates',
    name: 'Rates',
    description: 'Compare Options',
    icon: Truck,
    color: 'green'
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Secure Checkout',
    icon: CreditCard,
    color: 'orange'
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Label Ready',
    icon: CheckCircle,
    color: 'emerald'
  }
];

const ShippingWorkflowTracker: React.FC<ShippingWorkflowTrackerProps> = ({ currentStep }) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const getStepColors = (step: any, status: string) => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-500',
          text: 'text-white',
          border: 'border-green-500',
          icon: 'text-white'
        };
      case 'current':
        return {
          bg: `bg-${step.color}-500`,
          text: 'text-white',
          border: `border-${step.color}-500`,
          icon: 'text-white'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-400',
          border: 'border-gray-200',
          icon: 'text-gray-400'
        };
    }
  };

  return (
    <div className="w-full bg-white py-4 px-6 shadow-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const colors = getStepColors(step, status);
            const Icon = status === 'completed' ? Check : step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${colors.bg} ${colors.border}
                  `}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-2">
                    <div className={`text-sm font-semibold ${
                      status === 'current' ? `text-${step.color}-600` : 
                      status === 'completed' ? 'text-green-600' : 
                      'text-gray-400'
                    }`}>
                      {step.name}
                    </div>
                    <div className={`text-xs ${
                      status === 'current' ? `text-${step.color}-500` : 
                      status === 'completed' ? 'text-green-500' : 
                      'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShippingWorkflowTracker;

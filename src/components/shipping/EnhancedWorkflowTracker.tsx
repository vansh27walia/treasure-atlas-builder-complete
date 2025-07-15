
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Search, CreditCard, CheckCircle } from 'lucide-react';

interface EnhancedWorkflowTrackerProps {
  currentStep: 'address' | 'package' | 'rates' | 'payment' | 'complete';
}

const steps = [
  {
    id: 'address',
    name: 'Address',
    description: 'Pickup & Drop-off',
    icon: MapPin,
  },
  {
    id: 'package',
    name: 'Package',
    description: 'Type & Details',
    icon: Package,
  },
  {
    id: 'rates',
    name: 'Rates',
    description: 'Compare Options',
    icon: Search,
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Secure Checkout',
    icon: CreditCard,
  },
  {
    id: 'complete',
    name: 'Complete',
    description: 'Label Ready',
    icon: CheckCircle,
  }
];

const EnhancedWorkflowTracker: React.FC<EnhancedWorkflowTrackerProps> = ({ 
  currentStep: initialStep 
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    const handleStepChange = (event: CustomEvent) => {
      if (event.detail && event.detail.step) {
        setCurrentStep(event.detail.step);
      }
    };

    document.addEventListener('shipping-step-change', handleStepChange as EventListener);
    
    return () => {
      document.removeEventListener('shipping-step-change', handleStepChange as EventListener);
    };
  }, []);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getStepStatus = (stepIndex: number) => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-6">
      <div className="mx-auto max-w-6xl px-6">
        {/* Curved floating container */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className={`
                      w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative shadow-lg
                      ${status === 'completed' 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-blue-500/30' 
                        : status === 'current'
                        ? 'bg-blue-100 border-blue-600 text-blue-700 ring-4 ring-blue-100/50 shadow-blue-500/20'
                        : 'bg-white border-gray-300 text-gray-400 shadow-gray-200/50'
                      }
                    `}>
                      <Icon className="w-6 h-6" />
                      
                      {status === 'current' && (
                        <div className="absolute -inset-1 rounded-full bg-blue-500/10 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Step Text */}
                    <div className="text-center mt-3">
                      <div className={`text-sm font-bold transition-colors duration-300 ${
                        status === 'current' ? 'text-blue-700' : 
                        status === 'completed' ? 'text-blue-600' : 
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </div>
                      <div className={`text-xs mt-1 transition-colors duration-300 ${
                        status === 'current' ? 'text-blue-600' : 
                        status === 'completed' ? 'text-blue-500' : 
                        'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-6 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-blue-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkflowTracker;


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
    <div className="w-full py-4">
      <div className="mx-auto max-w-4xl px-4">
        {/* Glass effect container with reduced width */}
        <div className="bg-white/20 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 p-4 
                        bg-gradient-to-r from-white/10 to-white/5 
                        supports-[backdrop-filter]:bg-white/10">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative shadow-md
                      ${status === 'completed' 
                        ? 'bg-blue-600/90 border-blue-500 text-white shadow-blue-500/30 backdrop-blur-sm' 
                        : status === 'current'
                        ? 'bg-blue-100/80 border-blue-600 text-blue-700 ring-3 ring-blue-100/40 shadow-blue-500/20 backdrop-blur-sm'
                        : 'bg-white/60 border-gray-300 text-gray-400 shadow-gray-200/40 backdrop-blur-sm'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                      
                      {status === 'current' && (
                        <div className="absolute -inset-1 rounded-full bg-blue-500/10 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Step Text */}
                    <div className="text-center mt-2">
                      <div className={`text-xs font-bold transition-colors duration-300 ${
                        status === 'current' ? 'text-blue-700' : 
                        status === 'completed' ? 'text-blue-600' : 
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </div>
                      <div className={`text-xs mt-0.5 transition-colors duration-300 ${
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
                    <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-blue-500/80' : 'bg-gray-200/60'
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

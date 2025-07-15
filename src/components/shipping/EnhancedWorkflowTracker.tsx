
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
    <div className="fixed top-0 left-0 right-0 z-50 py-4">
      <div className="mx-auto max-w-4xl px-6">
        {/* Curved floating glass container with better styling */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-4 mx-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    {/* Step Circle with enhanced styling */}
                    <div className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative
                      ${status === 'completed' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30' 
                        : status === 'current'
                        ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-200/50 shadow-lg shadow-blue-500/20'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-400 shadow-sm'
                      }
                    `}>
                      <Icon className="w-5 h-5" />
                      
                      {status === 'current' && (
                        <div className="absolute -inset-2 rounded-full bg-blue-400/10 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Step Text with better typography */}
                    <div className="text-center mt-2">
                      <div className={`text-xs font-bold transition-colors duration-300 ${
                        status === 'current' ? 'text-blue-700' : 
                        status === 'completed' ? 'text-blue-600' : 
                        'text-gray-500'
                      }`}>
                        {step.name}
                      </div>
                      <div className={`text-[10px] mt-0.5 transition-colors duration-300 ${
                        status === 'current' ? 'text-blue-600' : 
                        status === 'completed' ? 'text-blue-500' : 
                        'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line with enhanced styling */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gray-200'
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

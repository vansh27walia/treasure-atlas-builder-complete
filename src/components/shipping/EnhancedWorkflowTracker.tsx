
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
    <div className="sticky top-0 z-50 w-full">
      <div 
        className="mx-auto max-w-6xl p-3 mb-4"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`
                    w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative
                    ${status === 'completed' 
                      ? 'bg-blue-500/80 border-blue-400 text-white shadow-lg shadow-blue-500/30 backdrop-blur-sm' 
                      : status === 'current'
                      ? 'bg-blue-100/30 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/20 ring-4 ring-blue-100/20 backdrop-blur-sm'
                      : 'bg-gray-100/20 border-gray-300/50 text-gray-400 backdrop-blur-sm'
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                    
                    {status === 'current' && (
                      <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse backdrop-blur-sm" />
                    )}
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-2">
                    <div className={`text-sm font-bold ${
                      status === 'current' ? 'text-blue-700' : 
                      status === 'completed' ? 'text-blue-600' : 
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className={`text-xs mt-0.5 ${
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
                  <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-300 backdrop-blur-sm ${
                    status === 'completed' ? 'bg-blue-500/60' : 'bg-gray-300/30'
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

export default EnhancedWorkflowTracker;

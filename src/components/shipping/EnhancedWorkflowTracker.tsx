
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Package, CreditCard, FileText, Truck, MapPin } from 'lucide-react';

interface EnhancedWorkflowTrackerProps {
  currentStep: 'address' | 'package' | 'rates' | 'payment' | 'complete';
}

const steps = [
  { id: 'address', label: 'Address', icon: MapPin, description: 'Pickup & Drop-off' },
  { id: 'package', label: 'Package', icon: Package, description: 'Type & Details' },
  { id: 'rates', label: 'Rates', icon: Truck, description: 'Compare Options' },
  { id: 'payment', label: 'Payment', icon: CreditCard, description: 'Secure Checkout' },
  { id: 'complete', label: 'Complete', icon: CheckCircle, description: 'Label Ready' },
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
    const currentStepIndex = getCurrentStepIndex();
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'upcoming';
  };

  const getCompletionPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="sticky top-0 z-50 w-full">
      <div 
        className="mx-auto max-w-6xl p-4 mb-4"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative
                    ${status === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                      : status === 'current'
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                    }
                  `}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                    
                    {status === 'current' && (
                      <div className="absolute -inset-1 rounded-full bg-blue-500/20 animate-pulse" />
                    )}
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-3">
                    <div className={`text-sm font-bold ${
                      status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className={`text-xs mt-1 ${
                      status === 'current' ? 'text-blue-500' : 
                      status === 'completed' ? 'text-green-500' : 
                      'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                    {status === 'current' && (
                      <Badge variant="secondary" className="mt-2 text-xs bg-blue-100 text-blue-800 border-blue-200">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4 rounded-full transition-all duration-300
                    ${status === 'completed' ? 'bg-green-400' : 'bg-gray-200'}
                  `} />
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

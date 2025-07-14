
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Package, CreditCard, FileText, Truck, MapPin } from 'lucide-react';

interface EnhancedWorkflowTrackerProps {
  currentStep: 'package' | 'rates' | 'payment' | 'label' | 'complete';
}

const steps = [
  { id: 'package', label: 'Package Info', icon: Package },
  { id: 'rates', label: 'Choose Rate', icon: Truck },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'label', label: 'Create Label', icon: FileText },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
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

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4 md:space-x-8">
            {steps.map((step, index) => {
              const status = getStepStatus(index);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : status === 'current'
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                      }
                    `}>
                      {status === 'completed' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className={`
                        text-xs font-medium transition-colors duration-300
                        ${status === 'current' 
                          ? 'text-blue-600' 
                          : status === 'completed'
                          ? 'text-green-600'
                          : 'text-gray-500'
                        }
                      `}>
                        {step.label}
                      </div>
                      {status === 'current' && (
                        <Badge variant="secondary" className="mt-1 text-xs bg-blue-100 text-blue-800">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`
                      w-8 md:w-16 h-0.5 mx-2 md:mx-4 transition-colors duration-300
                      ${getStepStatus(index + 1) !== 'upcoming' 
                        ? 'bg-green-300' 
                        : 'bg-gray-200'
                      }
                    `} />
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

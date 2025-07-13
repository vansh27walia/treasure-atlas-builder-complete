
import React from 'react';
import { MapPin, Package, Search, CreditCard, FileText, CheckCircle } from 'lucide-react';

interface EnhancedWorkflowTrackerProps {
  currentStep: 'address' | 'package' | 'rates' | 'review' | 'payment' | 'complete';
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
    id: 'review',
    name: 'Review',
    description: 'Confirm Details',
    icon: FileText,
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

const EnhancedWorkflowTracker: React.FC<EnhancedWorkflowTrackerProps> = ({ currentStep }) => {
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
    <div className="w-full bg-white/80 backdrop-blur-md shadow-lg border border-white/20 rounded-2xl p-6 mb-8 mx-auto max-w-4xl" 
         style={{
           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
           boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
         }}>
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
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                    : status === 'current'
                    ? 'bg-blue-100 border-blue-500 text-blue-600 shadow-lg shadow-blue-500/20 ring-4 ring-blue-100'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                  
                  {status === 'current' && (
                    <div className="absolute -inset-1 rounded-full bg-blue-500 opacity-20 animate-pulse" />
                  )}
                </div>
                
                {/* Step Text */}
                <div className="text-center mt-3">
                  <div className={`text-sm font-semibold ${
                    status === 'current' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-blue-600' : 
                    'text-gray-400'
                  }`}>
                    {step.name}
                  </div>
                  <div className={`text-xs mt-1 ${
                    status === 'current' ? 'text-blue-500' : 
                    status === 'completed' ? 'text-blue-500' : 
                    'text-gray-400'
                  }`}>
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                  status === 'completed' ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedWorkflowTracker;

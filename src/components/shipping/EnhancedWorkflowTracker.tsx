
import React from 'react';
import { MapPin, Package, Search } from 'lucide-react';

interface EnhancedWorkflowTrackerProps {
  currentStep: 'address' | 'package' | 'rates';
}

const steps = [
  {
    id: 'address',
    name: 'Addresses',
    description: 'Pickup & Drop-off',
    icon: MapPin,
  },
  {
    id: 'package',
    name: 'Package',
    description: 'Details & Options',
    icon: Package,
  },
  {
    id: 'rates',
    name: 'Rates',
    description: 'Compare & Select',
    icon: Search,
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
    <div className="sticky top-0 z-50 w-full">
      <div 
        className="mx-auto max-w-4xl p-6 mb-8"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
                    w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative
                    ${status === 'completed' 
                      ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 backdrop-blur-sm' 
                      : status === 'current'
                      ? 'bg-blue-500/90 border-blue-400 text-white shadow-xl shadow-blue-500/40 ring-4 ring-blue-100/30 backdrop-blur-sm scale-110'
                      : 'bg-gray-100/30 border-gray-300/40 text-gray-500 backdrop-blur-sm'
                    }
                  `}>
                    <Icon className="w-8 h-8" />
                    
                    {status === 'current' && (
                      <div className="absolute -inset-2 rounded-full bg-blue-500/20 animate-pulse backdrop-blur-sm" />
                    )}
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-4">
                    <div className={`text-lg font-bold ${
                      status === 'current' ? 'text-blue-800' : 
                      status === 'completed' ? 'text-emerald-700' : 
                      'text-gray-600'
                    }`}>
                      {step.name}
                    </div>
                    <div className={`text-sm mt-1 ${
                      status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-emerald-600' : 
                      'text-gray-500'
                    }`}>
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-8 rounded-full transition-all duration-500 backdrop-blur-sm ${
                    status === 'completed' ? 'bg-emerald-500/70' : 'bg-gray-300/40'
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

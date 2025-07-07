
import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface BatchProgressTrackerProps {
  currentStep: 'upload' | 'mapping' | 'rates' | 'payment' | 'creation' | 'complete';
  isProcessing?: boolean;
}

const BatchProgressTracker: React.FC<BatchProgressTrackerProps> = ({ currentStep, isProcessing }) => {
  const steps = [
    { key: 'upload', label: 'Upload File', icon: Circle },
    { key: 'mapping', label: 'Map Headers', icon: Circle },
    { key: 'rates', label: 'Get Rates', icon: Circle },
    { key: 'payment', label: 'Payment', icon: Circle },
    { key: 'creation', label: 'Create Labels', icon: Circle },
    { key: 'complete', label: 'Complete', icon: CheckCircle },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return isProcessing ? 'processing' : 'current';
    return 'pending';
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch Processing Progress</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const Icon = status === 'completed' ? CheckCircle : status === 'processing' ? Clock : Circle;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${status === 'completed' ? 'bg-green-100 border-green-500 text-green-700' : 
                    status === 'current' || status === 'processing' ? 'bg-blue-100 border-blue-500 text-blue-700' : 
                    'bg-gray-100 border-gray-300 text-gray-500'}
                  ${status === 'processing' ? 'animate-pulse' : ''}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`
                  text-xs mt-2 font-medium text-center
                  ${status === 'completed' ? 'text-green-700' : 
                    status === 'current' || status === 'processing' ? 'text-blue-700' : 
                    'text-gray-500'}
                `}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-0.5 mx-4 
                  ${status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BatchProgressTracker;


import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface ProgressTrackerProps {
  currentStep: 'upload' | 'processing' | 'rates' | 'selection' | 'labels';
  isProcessing?: boolean;
  completedSteps?: string[];
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  currentStep,
  isProcessing = false,
  completedSteps = []
}) => {
  const steps = [
    { id: 'upload', label: 'Upload CSV', description: 'Upload shipment data' },
    { id: 'processing', label: 'Processing', description: 'Validating data' },
    { id: 'rates', label: 'Fetch Rates', description: 'Getting shipping rates' },
    { id: 'selection', label: 'Rate Selection', description: 'Choose carriers' },
    { id: 'labels', label: 'Create Labels', description: 'Generate labels' }
  ];

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return isProcessing ? 'processing' : 'current';
    return 'pending';
  };

  const getStepIcon = (stepId: string, status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'current':
        return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-200 bg-white">
                    {getStepIcon(step.id, status)}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'current' || status === 'processing' ? 'text-blue-600' :
                      'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-px w-20 mx-4 ${
                    completedSteps.includes(steps[index + 1].id) ? 'bg-green-600' : 'bg-gray-200'
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

export default ProgressTracker;

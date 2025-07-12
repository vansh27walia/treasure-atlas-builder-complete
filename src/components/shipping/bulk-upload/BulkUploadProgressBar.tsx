
import React from 'react';
import { CheckCircle, Circle, Upload, Brain, List, Tag } from 'lucide-react';

export type BulkUploadStep = 'upload' | 'mapping' | 'rates' | 'labels';

interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
}

const steps = [
  { key: 'upload' as BulkUploadStep, label: 'Upload CSV', icon: Upload },
  { key: 'mapping' as BulkUploadStep, label: 'AI Mapping', icon: Brain },
  { key: 'rates' as BulkUploadStep, label: 'Review Rates', icon: List },
  { key: 'labels' as BulkUploadStep, label: 'Generate Labels', icon: Tag },
];

const BulkUploadProgressBar: React.FC<BulkUploadProgressBarProps> = ({
  currentStep,
  completedSteps
}) => {
  const getStepStatus = (stepKey: BulkUploadStep) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="w-full bg-white border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key);
            const IconComponent = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex items-center space-x-3">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                      ${status === 'completed' 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : status === 'current'
                        ? 'bg-blue-500 text-white shadow-lg animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`
                        text-sm font-medium transition-colors duration-300
                        ${status === 'completed' 
                          ? 'text-green-600' 
                          : status === 'current'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {status === 'completed' ? 'Complete' : status === 'current' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
                
                {!isLast && (
                  <div className="flex-1 mx-4">
                    <div 
                      className={`
                        h-1 rounded-full transition-all duration-500
                        ${status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-gray-200'
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProgressBar;

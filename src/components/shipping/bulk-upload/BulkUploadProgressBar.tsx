
import React from 'react';
import { CheckCircle, Circle, Upload, Brain, Settings, Download } from 'lucide-react';

export type BulkUploadStep = 'upload' | 'mapping' | 'rates' | 'labels';

interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
}

const steps = [
  {
    id: 'upload' as const,
    title: 'Upload CSV',
    description: 'Select and upload your CSV file',
    icon: Upload
  },
  {
    id: 'mapping' as const,
    title: 'AI Mapping',
    description: 'Smart header mapping with AI',
    icon: Brain
  },
  {
    id: 'rates' as const,
    title: 'Select Rates',
    description: 'Choose carriers and services',
    icon: Settings
  },
  {
    id: 'labels' as const,
    title: 'Generate Labels',
    description: 'Create and download labels',
    icon: Download
  }
];

const BulkUploadProgressBar: React.FC<BulkUploadProgressBarProps> = ({
  currentStep,
  completedSteps
}) => {
  const getStepStatus = (stepId: BulkUploadStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full py-8 px-4 bg-gradient-to-r from-blue-25 via-indigo-25 to-purple-25">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`
                  relative flex items-center justify-center w-16 h-16 rounded-full border-3 transition-all duration-500 shadow-lg
                  ${status === 'completed' 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-400 text-white shadow-emerald-200' 
                    : status === 'current'
                    ? 'bg-gradient-to-br from-blue-400 to-indigo-500 border-blue-400 text-white animate-pulse shadow-blue-200'
                    : 'bg-white border-gray-300 text-gray-400 shadow-gray-100'
                  }
                `}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-8 h-8" />
                  ) : (
                    <Icon className="w-8 h-8" />
                  )}
                </div>
                
                <div className="mt-4 text-center max-w-32">
                  <div className={`
                    text-base font-bold mb-1
                    ${status === 'current' 
                      ? 'text-blue-700' 
                      : status === 'completed' 
                      ? 'text-emerald-700' 
                      : 'text-gray-500'
                    }
                  `}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600 leading-tight hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-1 mx-6 mt-[-32px] transition-all duration-500 rounded-full
                  ${completedSteps.includes(step.id) 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-sm' 
                    : 'bg-gray-200'
                  }
                `} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkUploadProgressBar;

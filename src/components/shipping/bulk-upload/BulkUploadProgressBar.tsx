import React from 'react';
import { CheckCircle, Circle, Upload, Brain, Settings, Download } from 'lucide-react';
export type BulkUploadStep = 'upload' | 'mapping' | 'rates' | 'labels';
interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
}
const steps = [{
  id: 'upload' as const,
  title: 'Upload CSV',
  description: 'Select and upload your CSV file',
  icon: Upload
}, {
  id: 'mapping' as const,
  title: 'AI Mapping',
  description: 'Smart header mapping with AI',
  icon: Brain
}, {
  id: 'rates' as const,
  title: 'Select Rates',
  description: 'Choose carriers and services',
  icon: Settings
}, {
  id: 'labels' as const,
  title: 'Generate Labels',
  description: 'Create and download labels',
  icon: Download
}];
const BulkUploadProgressBar: React.FC<BulkUploadProgressBarProps> = ({
  currentStep,
  completedSteps
}) => {
  const getStepStatus = (stepId: BulkUploadStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };
  return <div className="w-full py-6 px-4 rounded-sm">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const Icon = step.icon;
        return <div key={step.id} className="flex items-center flex-1 py-0">
              <div className="flex flex-col items-center">
                <div className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : status === 'current' ? 'bg-blue-500 border-blue-500 text-white animate-pulse' : 'bg-gray-100 border-gray-300 text-gray-400'}
                `}>
                  {status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                </div>
                
                <div className="mt-3 text-center">
                  <div className={`
                    text-sm font-semibold
                    ${status === 'current' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {index < steps.length - 1 && <div className={`
                  flex-1 h-0.5 mx-4 mt-[-24px] transition-all duration-300
                  ${completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-300'}
                `} />}
            </div>;
      })}
      </div>
    </div>;
};
export default BulkUploadProgressBar;
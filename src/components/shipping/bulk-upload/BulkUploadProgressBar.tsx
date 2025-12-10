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
  return (
    <div className="w-full py-4 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const Icon = status === 'completed' ? CheckCircle : step.icon;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Step Circle */}
                  <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                    ${status === 'completed' ? 'bg-green-500 border-green-500' : 
                      status === 'current' ? 'bg-blue-500 border-blue-500' : 
                      'bg-gray-100 border-gray-200'}
                  `}>
                    <Icon className={`w-6 h-6 ${
                      status === 'completed' || status === 'current' ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  {/* Step Text */}
                  <div className="text-center mt-2">
                    <div className={`text-sm font-semibold ${
                      status === 'current' ? 'text-blue-600' : 
                      status === 'completed' ? 'text-green-600' : 
                      'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-xs hidden sm:block ${
                      status === 'current' ? 'text-blue-500' : 
                      status === 'completed' ? 'text-green-500' : 
                      'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
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
export default BulkUploadProgressBar;
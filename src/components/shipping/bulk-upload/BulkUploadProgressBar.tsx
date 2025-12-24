import React from 'react';
import { CheckCircle, Upload, Brain, Settings, Download } from 'lucide-react';

export type BulkUploadStep = 'upload' | 'mapping' | 'rates' | 'labels';

interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
  className?: string;
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
  completedSteps,
  className = ''
}) => {
  const getStepStatus = (stepId: BulkUploadStep) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className={`w-full py-3 sticky top-0 z-50 ${className}`}>
      <div className="mx-auto max-w-4xl px-4">
        {/* Fully translucent glassy container */}
        <div className="bg-white/20 backdrop-blur-xl shadow-lg border border-white/30 p-4 rounded-3xl">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = status === 'completed' ? CheckCircle : step.icon;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    {/* Step Circle */}
                    <div className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 relative
                      ${status === 'completed' 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/40' 
                        : status === 'current' 
                          ? 'bg-white/80 border-blue-600 text-blue-700 shadow-lg shadow-blue-500/30' 
                          : 'bg-white/40 border-gray-300/60 text-gray-400'}
                    `}>
                      <Icon className={`w-5 h-5 ${status === 'current' ? 'animate-pulse' : ''}`} />
                      
                      {/* Blinking ring for current step */}
                      {status === 'current' && (
                        <div className="absolute -inset-1.5 rounded-full border-2 border-blue-400 animate-ping opacity-75" />
                      )}
                    </div>
                    
                    {/* Step Text */}
                    <div className="text-center mt-2">
                      <div className={`text-xs font-bold transition-colors duration-300 ${
                        status === 'current' 
                          ? 'text-blue-700' 
                          : status === 'completed' 
                            ? 'text-blue-600' 
                            : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-xs mt-1 transition-colors duration-300 hidden sm:block ${
                        status === 'current' 
                          ? 'text-blue-600' 
                          : status === 'completed' 
                            ? 'text-blue-500' 
                            : 'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${
                      status === 'completed' ? 'bg-blue-500' : 'bg-gray-200/50'
                    }`} />
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

export default BulkUploadProgressBar;

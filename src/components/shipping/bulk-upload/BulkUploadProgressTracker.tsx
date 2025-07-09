
import React from 'react';
import { CheckCircle, Circle, Clock, Upload, Brain, Zap, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkUploadProgressTrackerProps {
  currentStep: 'upload' | 'mapping' | 'rates' | 'labels' | 'complete';
  isProcessing?: boolean;
}

const BulkUploadProgressTracker: React.FC<BulkUploadProgressTrackerProps> = ({ 
  currentStep, 
  isProcessing = false 
}) => {
  const steps = [
    { 
      key: 'upload', 
      label: 'Upload CSV', 
      icon: Upload,
      description: 'Select and upload your CSV file'
    },
    { 
      key: 'mapping', 
      label: 'AI Header Mapping', 
      icon: Brain,
      description: 'AI maps your headers automatically'
    },
    { 
      key: 'rates', 
      label: 'Fetch Rates', 
      icon: Zap,
      description: 'Get live shipping rates'
    },
    { 
      key: 'labels', 
      label: 'Create Labels', 
      icon: Package,
      description: 'Generate shipping labels'
    },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepIndex = steps.findIndex(s => s.key === stepKey);
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (stepIndex < currentIndex || currentStep === 'complete') return 'completed';
    if (stepIndex === currentIndex) return isProcessing ? 'processing' : 'current';
    return 'pending';
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Bulk Label Creation Process
        </h2>
        
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ 
                width: `${(steps.findIndex(s => s.key === currentStep) / (steps.length - 1)) * 100}%` 
              }}
            />
          </div>

          {steps.map((step, index) => {
            const status = getStepStatus(step.key);
            const Icon = step.icon;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 bg-white",
                  {
                    'border-green-500 text-green-600': status === 'completed',
                    'border-blue-500 text-blue-600': status === 'current' || status === 'processing',
                    'border-gray-300 text-gray-400': status === 'pending',
                    'animate-pulse': status === 'processing'
                  }
                )}>
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : status === 'processing' ? (
                    <Clock className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                
                <div className="mt-3 text-center">
                  <div className={cn(
                    "font-medium text-sm transition-colors",
                    {
                      'text-green-700': status === 'completed',
                      'text-blue-700': status === 'current' || status === 'processing',
                      'text-gray-500': status === 'pending'
                    }
                  )}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 max-w-24">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProgressTracker;

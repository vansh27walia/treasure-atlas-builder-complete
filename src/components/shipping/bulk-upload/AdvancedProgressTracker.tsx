
import React from 'react';
import { Upload, FileText, Truck, CheckCircle, FileCheck, Clock } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'active' | 'upcoming';
  duration?: string;
}

interface AdvancedProgressTrackerProps {
  currentStep: string;
  isProcessing?: boolean;
  completedSteps?: string[];
}

const AdvancedProgressTracker: React.FC<AdvancedProgressTrackerProps> = ({
  currentStep,
  isProcessing = false,
  completedSteps = []
}) => {
  const steps: ProgressStep[] = [
    {
      id: 'upload',
      label: 'Upload CSV',
      description: 'Upload and validate your CSV file',
      icon: Upload,
      status: 'upcoming'
    },
    {
      id: 'processing',
      label: 'Process Data',
      description: 'Parse and validate shipment data',
      icon: FileText,
      status: 'upcoming'
    },
    {
      id: 'rates',
      label: 'Fetch Rates',
      description: 'Get shipping rates from carriers',
      icon: Truck,
      status: 'upcoming'
    },
    {
      id: 'selection',
      label: 'Rate Selection',
      description: 'Choose rates for each shipment',
      icon: CheckCircle,
      status: 'upcoming'
    },
    {
      id: 'labels',
      label: 'Create Labels',
      description: 'Generate shipping labels',
      icon: FileCheck,
      status: 'upcoming'
    }
  ];

  // Update step statuses
  steps.forEach(step => {
    if (completedSteps.includes(step.id)) {
      step.status = 'completed';
    } else if (step.id === currentStep) {
      step.status = 'active';
    } else {
      step.status = 'upcoming';
    }
  });

  return (
    <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.status === 'active';
            const isCompleted = step.status === 'completed';
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center min-w-0">
                  {/* Icon Container */}
                  <div 
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-500 transform
                      ${isCompleted 
                        ? 'bg-green-500 text-white shadow-lg scale-110' 
                        : isActive 
                          ? 'bg-blue-500 text-white shadow-lg scale-110 animate-pulse' 
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    <StepIcon className="h-7 w-7" />
                    
                    {/* Processing indicator */}
                    {isActive && isProcessing && (
                      <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-ping"></div>
                    )}
                    
                    {/* Completion checkmark */}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Step Info */}
                  <div className="text-center">
                    <h3 
                      className={`font-semibold text-sm mb-1 transition-colors duration-300
                        ${isCompleted 
                          ? 'text-green-600' 
                          : isActive 
                            ? 'text-blue-600' 
                            : 'text-gray-500'
                        }
                      `}
                    >
                      {step.label}
                    </h3>
                    <p className="text-xs text-gray-500 max-w-24 leading-tight">
                      {step.description}
                    </p>
                    
                    {/* Active step indicator */}
                    {isActive && (
                      <div className="flex items-center justify-center mt-2">
                        <Clock className="h-3 w-3 text-blue-500 mr-1" />
                        <span className="text-xs text-blue-500 font-medium">In Progress</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress Line */}
                {index < steps.length - 1 && (
                  <div className="hidden sm:flex flex-1 mx-4 items-center">
                    <div className="relative h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out
                          ${isCompleted 
                            ? 'w-full bg-gradient-to-r from-green-500 to-green-600' 
                            : isActive 
                              ? 'w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse' 
                              : 'w-0 bg-gray-300'
                          }
                        `}
                      ></div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdvancedProgressTracker;

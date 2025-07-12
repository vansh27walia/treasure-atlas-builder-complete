import React from 'react';
import { UploadCloud, FileText, Calculator, Package, CheckCircle } from 'lucide-react';

export type BulkUploadStep = 'upload' | 'mapping' | 'rates' | 'labels';

interface BulkUploadProgressBarProps {
  currentStep: BulkUploadStep;
  completedSteps: BulkUploadStep[];
}

const BulkUploadProgressBar: React.FC<BulkUploadProgressBarProps> = ({ 
  currentStep, 
  completedSteps 
}) => {
  const steps: { key: BulkUploadStep; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload CSV', icon: <UploadCloud className="w-4 h-4" /> },
    { key: 'mapping', label: 'Map Headers', icon: <FileText className="w-4 h-4" /> },
    { key: 'rates', label: 'Select Rates', icon: <Calculator className="w-4 h-4" /> },
    { key: 'labels', label: 'Generate Labels', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              {/* Step Indicator */}
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${completedSteps.includes(step.key) || step.key === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-700'}
              `}>
                {completedSteps.includes(step.key) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Label */}
              <div className={`ml-2 text-sm font-medium ${completedSteps.includes(step.key) ? 'text-blue-800' : 'text-gray-600'}`}>
                {step.label}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`h-1 w-16 mx-1 ${completedSteps.includes(step.key) ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadProgressBar;


import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BulkLabelCreationProgressProps {
  isVisible: boolean;
  progress: number;
  currentStep: string;
  totalLabels: number;
  completedLabels: number;
  failedLabels: number;
}

const BulkLabelCreationProgress: React.FC<BulkLabelCreationProgressProps> = ({
  isVisible,
  progress,
  currentStep,
  totalLabels,
  completedLabels,
  failedLabels
}) => {
  if (!isVisible) return null;

  return (
    <div className="text-center">
      <div className="mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Creating Your Labels</h3>
        <p className="text-gray-600 mb-6">{currentStep}</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress}% complete</span>
        </div>
        <Progress value={progress} className="h-3 mb-4" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalLabels}</div>
            <div className="text-sm text-gray-600">Total Labels</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 mr-1" />
              {completedLabels}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 mr-1" />
              {failedLabels}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Please wait while we process your shipping labels. This may take a few moments.
      </div>
    </div>
  );
};

export default BulkLabelCreationProgress;

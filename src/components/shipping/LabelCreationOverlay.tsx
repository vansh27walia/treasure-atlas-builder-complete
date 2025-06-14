
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';

interface LabelCreationOverlayProps {
  isVisible: boolean;
  progress: number;
  currentStep: string;
  totalLabels: number;
  completedLabels: number;
  failedLabels: number;
  estimatedTimeRemaining?: number; // Made optional
  onClose: () => void;
}

const LabelCreationOverlay: React.FC<LabelCreationOverlayProps> = ({
  isVisible,
  progress,
  currentStep,
  totalLabels,
  completedLabels,
  failedLabels,
  // estimatedTimeRemaining, // Not used in the component body
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white">
        <div className="text-center">
          <div className="mb-4">
            <FileText className="h-12 w-12 mx-auto text-blue-600 animate-pulse" />
            <h3 className="text-lg font-semibold mt-2">Creating Labels</h3>
            <p className="text-gray-600 text-sm">{currentStep}</p>
          </div>
          
          <div className="mb-4">
            <Progress value={progress} className="h-3 mb-2" />
            <p className="text-sm text-gray-500">{progress}% Complete</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{totalLabels}</div>
              <div className="text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                {completedLabels}
              </div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {failedLabels}
              </div>
              <div className="text-gray-500">Failed</div>
            </div>
          </div>
          
          {/* Optional: Display estimatedTimeRemaining if provided and relevant */}
          {/* {estimatedTimeRemaining && progress < 100 && (
            <p className="text-xs text-gray-400 mt-1">Est. time remaining: {estimatedTimeRemaining}s</p>
          )} */}

          {progress === 100 && (
            <div className="mt-4">
              <button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                View Results {/* Changed button text */}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LabelCreationOverlay;



import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Clock, Package, FileText, Download } from 'lucide-react';

interface LabelGenerationProgressProps {
  isGenerating: boolean;
  totalShipments: number;
  processedShipments: number;
  successfulShipments: number;
  failedShipments: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
}

const LabelGenerationProgress: React.FC<LabelGenerationProgressProps> = ({
  isGenerating,
  totalShipments,
  processedShipments,
  successfulShipments,
  failedShipments,
  currentStep,
  estimatedTimeRemaining
}) => {
  const progress = totalShipments > 0 ? (processedShipments / totalShipments) * 100 : 0;

  if (!isGenerating && processedShipments === 0) {
    return null;
  }

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            {isGenerating ? 'Generating Shipping Labels' : 'Label Generation Complete'}
          </h3>
          {isGenerating && (
            <div className="flex items-center text-sm text-blue-600">
              <Clock className="h-4 w-4 mr-1" />
              {estimatedTimeRemaining ? `~${estimatedTimeRemaining}s remaining` : 'Processing...'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {processedShipments} of {totalShipments} shipments</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium text-green-700">{successfulShipments}</div>
              <div className="text-xs text-gray-500">Successful</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <div className="font-medium text-red-700">{failedShipments}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <Clock className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium text-blue-700">{totalShipments - processedShipments}</div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
          </div>
        </div>

        {isGenerating && (
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-blue-800">Current Step:</span>
            </div>
            <p className="text-sm text-gray-600">{currentStep}</p>
          </div>
        )}

        {!isGenerating && processedShipments > 0 && (
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-800">Generation Complete!</span>
            </div>
            <p className="text-sm text-gray-600">
              Labels have been generated with multiple formats (PNG, PDF, ZPL) and are ready for download.
            </p>
            <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <FileText className="h-3 w-3" />
                <span>Individual Labels</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download className="h-3 w-3" />
                <span>Batch Labels</span>
              </div>
              <div className="flex items-center space-x-1">
                <Package className="h-3 w-3" />
                <span>Pickup Manifest</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LabelGenerationProgress;

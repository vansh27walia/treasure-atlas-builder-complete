
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, Package } from 'lucide-react';

interface BulkUploadProgressProps {
  totalShipments: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  currentOperation: string;
  isComplete: boolean;
}

const BulkUploadProgress: React.FC<BulkUploadProgressProps> = ({
  totalShipments,
  processedCount,
  successCount,
  failedCount,
  currentOperation,
  isComplete
}) => {
  const progressPercentage = totalShipments > 0 ? (processedCount / totalShipments) * 100 : 0;

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-blue-800">
            {isComplete ? 'Batch Processing Complete!' : 'Processing Bulk Labels...'}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            {!isComplete && <Clock className="h-4 w-4 animate-pulse" />}
            <span>{processedCount} of {totalShipments} processed</span>
          </div>
        </div>

        <Progress value={progressPercentage} className="h-3" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-lg font-bold text-blue-600">{totalShipments}</div>
              <div className="text-sm text-gray-600">Total Shipments</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-lg font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-gray-600">Labels Created</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <div className="text-lg font-bold text-red-600">{failedCount}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>
        </div>

        {!isComplete && (
          <div className="text-center">
            <p className="text-sm text-blue-700 font-medium">{currentOperation}</p>
            <p className="text-xs text-blue-600 mt-1">
              Please wait while we process each shipment. This may take a few minutes for larger batches.
            </p>
          </div>
        )}

        {isComplete && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">
              Batch processing complete! {successCount} labels created successfully.
              {failedCount > 0 && ` ${failedCount} shipments failed.`}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BulkUploadProgress;

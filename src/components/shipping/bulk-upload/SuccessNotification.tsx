
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onProceedToPayment: () => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onProceedToPayment,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  const hasLabels = results.processedShipments.some(shipment => shipment.label_url);

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasLabels ? 'Labels Generated Successfully!' : 'Shipments Processed Successfully!'}
          </h3>
          <p className="text-green-700">
            {hasLabels 
              ? `${results.successful} shipping labels have been created and are ready for download.`
              : `${results.successful} shipments have been processed with live rates.`
            }
          </p>
        </div>
      </div>

      {results.failed > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {results.failed} shipments failed to process. Please check the error details below.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{results.successful}</div>
          <div className="text-sm text-gray-600">Successful Shipments</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">${results.totalCost.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {results.processedShipments.filter(s => s.label_url).length}
          </div>
          <div className="text-sm text-gray-600">Labels Generated</div>
        </div>
      </div>

      {/* Action Buttons - Matching International Shipping */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {hasLabels ? (
          <>
            <Button 
              onClick={onDownloadAllLabels}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isCreatingLabels}
            >
              <Download className="mr-2 h-4 w-4" />
              Download All Labels
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="border-green-200 hover:bg-green-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
          </>
        ) : (
          <Button 
            onClick={onCreateLabels}
            disabled={isCreatingLabels || isPaying}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreatingLabels ? 'Creating Labels...' : 'Generate Shipping Labels'}
          </Button>
        )}
      </div>

      {/* Successful Shipments Table - Matches international shipping behavior exactly */}
      <SuccessfulShipmentsTable
        shipments={results.processedShipments.filter(s => s.label_url || !hasLabels)}
        onDownloadSingleLabel={onDownloadSingleLabel}
        onDownloadAllLabels={onDownloadAllLabels}
      />

      {/* Failed Shipments */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="font-medium text-red-700">Row {failed.row}:</span>
                <span className="text-red-600 ml-2">{failed.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SuccessNotification;

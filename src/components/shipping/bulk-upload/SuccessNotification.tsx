import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, Printer } from 'lucide-react'; // Added Printer
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void; // For batch PDF or similar consolidated download
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void; // For individual labels from table
  // onCreateLabels?: () => void; // Might be removed if this component is only for *after* label creation
  isPaying?: boolean; // If payment step is involved
  isCreatingLabels?: boolean; // If label creation is still in progress (though typically this shows on success)
  onOpenBatchPrintPreview?: () => void; // Added prop
  onDownloadLabelsWithFormat?: (format: "pdf" | "png" | "zpl" | "epl", type: "all" | "batch") => Promise<void>;
  onEmailLabels?: (email: string) => Promise<void>;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels, // This is likely for the batch PDF
  onDownloadSingleLabel, // For individual labels from table
  isPaying, // Unused for now, but kept for potential future payment flows
  isCreatingLabels, // Should be false if this component is shown
  onOpenBatchPrintPreview,
  onDownloadLabelsWithFormat, // Might be used for "Download All ZPLs" etc.
  onEmailLabels, // For emailing labels
}) => {
  console.log('SuccessNotification received results:', results);

  let allShipments = results.processedShipments || [];
  
  const shipmentsWithLabels = allShipments.filter(shipment => 
    !!((shipment.label_url && shipment.label_url.trim() !== '') ||
    (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') ||
    (shipment.label_urls?.pdf && shipment.label_urls.pdf.trim() !== '') ||
    shipment.status === 'completed' || shipment.status === 'label_purchased')
  );

  const failedShipmentsCount = allShipments.filter(shipment => shipment.status === 'failed' || shipment.status === 'error').length;
  
  const hasBatchOutput = results.batchResult && (results.batchResult.consolidatedLabelUrls?.pdf || results.batchResult.scanFormUrl);

  return (
    <div className="space-y-6 mt-6">
      <Card className="p-6 border-green-200 bg-green-50 shadow-md">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-green-800">
              Label Generation Complete!
            </h3>
            <p className="text-green-700">
              {shipmentsWithLabels.length} label(s) successfully generated. 
              {results.batchResult?.batchId && ` Batch ID: ${results.batchResult.batchId}.`}
              {failedShipmentsCount > 0 && ` ${failedShipmentsCount} shipment(s) failed.`}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* ... stats cards ... */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-700">{allShipments.length}</div>
            <div className="text-sm text-gray-500">Total Processed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{shipmentsWithLabels.length}</div>
            <div className="text-sm text-gray-500">Labels Created</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{failedShipmentsCount}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-700">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-500">Total Shipping Cost</div>
          </div>
        </div>
        
        {/* Download/Action Buttons Section */}
        {(hasBatchOutput || (onOpenBatchPrintPreview && shipmentsWithLabels.length > 0)) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-lg text-blue-800 mb-3">Manage Batch Output</h4>
            <div className="flex flex-wrap gap-3">
              {results.batchResult?.consolidatedLabelUrls?.pdf && (
                <Button 
                  onClick={onDownloadAllLabels} // Assumes this downloads the batch PDF
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Batch PDF
                </Button>
              )}
              {onOpenBatchPrintPreview && (
                 <Button 
                  onClick={onOpenBatchPrintPreview}
                  variant="outline"
                  className="border-purple-500 text-purple-700 hover:bg-purple-50"
                >
                  <Printer className="mr-2 h-4 w-4" /> View Batch Print Preview
                </Button>
              )}
              {/* Add more batch actions if needed, e.g., download ZPL batch if available */}
            </div>
          </div>
        )}
      </Card>

      {shipmentsWithLabels.length > 0 && (
        <LabelResultsTable
          shipments={shipmentsWithLabels} // Show only those with labels
          onDownloadLabel={onDownloadSingleLabel}
        />
      )}

      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50">
          <h4 className="font-medium text-lg text-red-800 mb-3">Failed Shipments Details</h4>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {results.failedShipments.map((failed, index) => (
              <div key={failed.shipmentId || index} className="p-2 bg-white rounded border-l-4 border-red-500 text-xs">
                <span className="font-semibold">Row {failed.row || 'N/A'} (ID: {failed.shipmentId || 'Unknown'}):</span>
                <span className="ml-1 text-red-700">{failed.error || JSON.stringify(failed.details)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuccessNotification;

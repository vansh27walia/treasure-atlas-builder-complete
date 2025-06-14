import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, PackageSearch, Printer } from 'lucide-react';
import { BulkUploadResult, LabelFormat } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onCreateLabels: () => void; // Retained if needed for a retry/re-create scenario
  isPaying: boolean; // Retained for context
  isCreatingLabels: boolean; // Retained for context
  onDownloadLabelsWithFormat?: (format: LabelFormat) => void; // Changed from onDownloadAllLabels
  onOpenBatchPrintPreview?: () => void; // Added for the new print preview functionality
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadSingleLabel,
  onCreateLabels,
  isPaying,
  isCreatingLabels,
  onDownloadLabelsWithFormat,
  onOpenBatchPrintPreview,
}) => {
  console.log('SuccessNotification received results:', results);

  // Safely get shipments array
  let allShipments = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments;
  } else if (results.processedShipments && typeof results.processedShipments === 'object') {
    const shipmentValues = Object.values(results.processedShipments);
    allShipments = shipmentValues.filter(item => 
      item && 
      typeof item === 'object' && 
      'id' in item
    );
  }
  
  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);
  
  // Count shipments with labels
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasLabel = !!(
      (shipment.label_url && shipment.label_url.trim() !== '') ||
      (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') ||
      shipment.status === 'completed'
    );
    return hasLabel;
  });

  // Count failed shipments
  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');
  
  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    failedShipments: failedShipments.length
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;

  // Show notification if we have shipments or results
  const shouldShowNotification = totalProcessed > 0 || results.total > 0 || results.successful > 0;

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
      if (!url || url.trim() === '') {
        toast.error('Invalid label URL - cannot download');
        return;
      }

      // Direct download approach
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  // This internal function can stay if it's used for a specific "download all individual PNGs" button
  // If not, it might be removed or repurposed.
  const handleDownloadAllIndividualPngs = async () => {
    console.log('Downloading all individual PNG labels, count:', shipmentsWithLabels.length);
    
    if (shipmentsWithLabels.length === 0) {
      toast.error('No individual labels available for download');
      return;
    }

    toast.loading('Starting individual PNG downloads...');
    
    let successCount = 0;
    
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      const labelUrl = shipment.label_urls?.png || shipment.label_url;
      if (labelUrl && labelUrl.trim() !== '') {
        try {
          // Stagger downloads
          await new Promise(resolve => setTimeout(resolve, i * 300));
          const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode || `shipment_${shipment.id || i + 1}`;
          await downloadFile(labelUrl, `label_${trackingCode}.png`);
          successCount++;
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss(); // Dismiss loading toast
    if (successCount > 0) {
      toast.success(`Started download of ${successCount} individual PNG labels.`);
    } else if (shipmentsWithLabels.length > 0) {
      toast.warning('Could not download individual PNG labels.');
    }
  };

  // Don't show if no data
  if (!shouldShowNotification) {
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {results.batchResult || hasLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {results.batchResult || hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created.`
                : `${displayTotal} shipments have been processed and are ready for label creation.`
              }
              {displayFailed > 0 && ` ${displayFailed} shipments failed.`}
              {results.batchResult?.scanFormUrl && " Scan form generated."}
            </p>
          </div>
        </div>

        {displayFailed > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> {displayFailed} shipments failed to process. Please check the error details below.
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displayTotal}</div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displaySuccessful}</div>
            <div className="text-sm text-gray-600">Labels Created</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{displayFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Shipping Cost</div>
          </div>
        </div>

        {/* Download Buttons Section */}
        {(results.batchResult || hasLabels) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Label Outputs</h4>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {onOpenBatchPrintPreview && (results.batchResult?.batchId || shipmentsWithLabels.length > 0) && (
                <Button 
                  onClick={onOpenBatchPrintPreview}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print/View Batch Output
                </Button>
              )}
              {onDownloadLabelsWithFormat && results.batchResult?.consolidatedLabelUrls?.zip && (
                <Button 
                  onClick={() => onDownloadLabelsWithFormat('zip')} // Assuming 'zip' is for batch zip
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All (ZIP)
                </Button>
              )}
              {results.batchResult?.scanFormUrl && (
                 <Button 
                  onClick={() => downloadFile(results.batchResult!.scanFormUrl!, `scanform_${results.batchResult!.batchId}.pdf`)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download Scan Form (PDF)
                </Button>
              )}
            </div>
             {/* Optional: Button to download individual PNGs if still desired */}
            {shipmentsWithLabels.length > 0 && !results.batchResult?.consolidatedLabelUrls?.zip && (
              <Button 
                onClick={handleDownloadAllIndividualPngs}
                variant="ghost"
                className="text-blue-600 hover:text-blue-700 mt-3 w-full justify-start"
              >
                <PackageSearch className="mr-2 h-4 w-4" />
                Download Individual PNGs ({shipmentsWithLabels.length})
              </Button>
            )}
          </div>
        )}

        {/* Create Labels Button - if processing was successful but no labels/batch yet */}
        {!results.batchResult && !hasLabels && displayTotal > 0 && displaySuccessful === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and download shipping labels.
            </p>
            <Button 
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreatingLabels ? 'Creating Labels...' : 'Create All Labels Now'}
            </Button>
          </div>
        )}
      </Card>

      {/* New Clean Table Display */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string, format?: string) => {
            if (url && url.trim() !== '') {
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              downloadFile(url, filename);
            } else {
              toast.error('Invalid label URL - cannot download');
            }
          }}
        />
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments Details</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded border-l-4 border-red-400">
                <span className="font-medium text-red-700">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}:
                </span>
                <span className="text-red-600 ml-2 block text-sm">{failed.details || failed.error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuccessNotification;

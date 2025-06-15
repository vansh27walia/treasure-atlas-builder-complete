
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, PrinterIcon, Eye } from 'lucide-react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import LabelResultsTable from './LabelResultsTable';
import PrintPreview from '@/components/shipping/PrintPreview';

interface Shipment extends BulkShipment {
  label_urls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  errors?: { details: string; error: string; }[];
}

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onCreateLabels,
  isCreatingLabels
}) => {
  console.log('SuccessNotification received results:', results);

  let allShipments: Shipment[] = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments as Shipment[];
  }

  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);

  // Helper to determine the best label URL and its format (PDF preferred)
  const getLabelDownloadInfo = (shipment: Shipment) => {
    if (shipment.label_urls?.pdf && shipment.label_urls.pdf.trim() !== '') {
      return { url: shipment.label_urls.pdf, format: 'pdf', type: 'PDF' };
    }
    if (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') {
      return { url: shipment.label_urls.png, format: 'png', type: 'PNG' };
    }
    if (shipment.label_url && shipment.label_url.trim() !== '') {
      const urlLower = shipment.label_url.toLowerCase();
      if (urlLower.endsWith('.pdf')) {
        return { url: shipment.label_url, format: 'pdf', type: 'PDF' };
      }
      return { url: shipment.label_url, format: 'png', type: 'PNG' };
    }
    return null;
  };

  // Filter shipments that have any label URL (PNG or PDF)
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const info = getLabelDownloadInfo(shipment);
    return info !== null;
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

  // Utility function to handle actual file download
  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Attempting to download file from URL:', url, 'as', filename);

      if (!url || url.trim() === '') {
        toast.error('Invalid label URL - cannot download');
        return;
      }

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

  // Handler for downloading all available labels (now preferring PDF)
  const handleDownloadAllIndividualLabels = async () => {
    console.log('Downloading all individual labels, count:', shipmentsWithLabels.length);

    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    toast.loading('Starting downloads for all labels...');

    // Use a small delay between downloads to prevent browser blocking and allow multiple downloads
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      const labelInfo = getLabelDownloadInfo(shipment);

      if (labelInfo) {
        const { url, format } = labelInfo;
        setTimeout(async () => {
          const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
          // Construct a meaningful filename including tracking code and correct extension
          const filename = `label_${trackingCode || `shipment_${shipment.id || i + 1}`}.${format}`;
          await downloadFile(url, filename);
        }, i * 500);
      }
    }

    toast.dismiss();
    setTimeout(() => {
      toast.success(`Started download of ${shipmentsWithLabels.length} labels (PDFs preferred)`);
    }, 1000 + (shipmentsWithLabels.length * 500));
  };

  // Don't show the notification component if no relevant data is present
  if (!shouldShowNotification) {
    return null;
  }

  // Display statistics
  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Consolidated Labels Section */}
      {hasLabels && results.batchResult && (
        <Card className="p-6 bg-blue-50 border-blue-200 rounded-lg shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 mb-2">📑 Consolidated Labels</h2>
              <p className="text-blue-700">
                All {displaySuccessful} labels consolidated into a single document for easy printing and sharing.
              </p>
            </div>
            
            <div className="flex gap-3">
              {/* Print Preview All Labels Button */}
              <PrintPreview
                labelUrl=""
                trackingCode={null}
                batchResult={results.batchResult}
                isBatchPreview={true}
                triggerButton={
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    Print Preview All Labels
                  </Button>
                }
              />
              
              {/* Download Consolidated PDF */}
              {results.batchResult?.consolidatedLabelUrls?.pdf && (
                <Button
                  onClick={() => downloadFile(results.batchResult!.consolidatedLabelUrls.pdf!, 'consolidated_labels.pdf')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download All (PDF)
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Success Statistics Card */}
      <Card className="p-6 border-green-200 bg-green-50 rounded-lg shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {hasLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and are ready for download.`
                : `${displayTotal} shipments have been processed and are ready for label creation.`
              }
              {displayFailed > 0 && ` ${displayFailed} shipments failed.`}
            </p>
          </div>
        </div>

        {displayFailed > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
            <strong>Note:</strong> {displayFailed} shipments failed to process. Please check the error details below.
          </div>
        )}

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{displayTotal}</div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{displaySuccessful}</div>
            <div className="text-sm text-gray-600">Labels Created</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-600">{displayFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Shipping Cost</div>
          </div>
        </div>

        {/* Quick Download Section */}
        {hasLabels && (
          <div className="mb-6 p-4 bg-white border border-green-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg text-green-800 mb-4">Quick Download Actions</h4>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDownloadAllIndividualLabels}
                className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition duration-200 ease-in-out transform hover:scale-105 shadow-md"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Individual Labels ({shipmentsWithLabels.length} Files)
              </Button>
            </div>
          </div>
        )}

        {/* Create Labels Button */}
        {!hasLabels && displayTotal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and download shipping labels.
            </p>
            <Button
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-3 transition duration-200 ease-in-out transform hover:scale-105 shadow-md"
              size="lg"
            >
              {isCreatingLabels ? 'Creating Labels...' : 'Create All Labels Now'}
            </Button>
          </div>
        )}
      </Card>

      {/* Individual Labels Table */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string) => {
            const timestamp = Date.now();
            const filename = `shipping_label_${timestamp}.pdf`;
            downloadFile(url, filename);
          }}
          getLabelDownloadInfo={getLabelDownloadInfo}
        />
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-6 border-red-200 bg-red-50 rounded-lg shadow-sm">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments Details</h4>
          <div className="bg-red-100 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded border-l-4 border-red-400 shadow-sm">
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

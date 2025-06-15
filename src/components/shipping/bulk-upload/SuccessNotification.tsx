import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping'; // Assuming BulkUploadResult is defined here
import { toast } from '@/components/ui/sonner'; // Assuming toast for notifications

// Define the structure for a single shipment, including potential PDF URLs
interface Shipment {
  id: string;
  label_url?: string; // Legacy field, might be PNG or PDF
  label_urls?: {
    png?: string;
    pdf?: string; // New field for PDF label URL
  };
  status: string;
  tracking_number?: string;
  tracking_code?: string;
  trackingCode?: string;
  errors?: { details: string; error: string; }[]; // To capture specific errors for failed shipments
  // Add other properties as needed based on your actual data structure
}

// Extend BulkUploadResult to ensure processedShipments can hold Shipment objects
interface BulkUploadResultExtended extends BulkUploadResult {
  processedShipments?: Shipment[] | Record<string, Shipment>;
  failedShipments?: { row?: number; details?: string; error?: string; }[]; // Ensure this matches the existing usage
}

interface SuccessNotificationProps {
  results: BulkUploadResultExtended;
  // onDownloadAllLabels: () => void; // This prop is handled internally for individual label downloads
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void; // This prop is no longer directly used by this component's internal logic for single label downloads, but kept for interface consistency if needed elsewhere.
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

// Placeholder for LabelResultsTable component to resolve import error
interface LabelResultsTableProps {
  shipments: Shipment[];
  onDownloadLabel: (shipment: Shipment) => void;
}

const LabelResultsTable: React.FC<LabelResultsTableProps> = ({ shipments, onDownloadLabel }) => {
  return (
    <Card className="p-6 rounded-lg shadow-sm">
      <h4 className="font-semibold text-lg text-gray-800 mb-4">Shipment Details</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment) => {
              const labelInfo = getLabelDownloadInfo(shipment); // Use the helper from parent context (assuming it's accessible or passed down)
              return (
                <tr key={shipment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shipment.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {shipment.tracking_number || shipment.tracking_code || shipment.trackingCode || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${shipment.status === 'completed' ? 'bg-green-100 text-green-800' :
                         shipment.status === 'failed' ? 'bg-red-100 text-red-800' :
                         'bg-gray-100 text-gray-800'}`}>
                      {shipment.status}
                    </span>
                    {shipment.status === 'failed' && shipment.errors && (
                      <div className="text-red-500 text-xs mt-1">
                        {shipment.errors.map((err, idx) => (
                          <p key={idx}>{err.details || err.error}</p>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {labelInfo && (
                      <Button
                        onClick={() => onDownloadLabel(shipment)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-md text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" /> Download {labelInfo.type}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onCreateLabels,
  isCreatingLabels
}) => {
  console.log('SuccessNotification received results:', results);

  let allShipments: Shipment[] = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments;
  } else if (results.processedShipments && typeof results.processedShipments === 'object') {
    // Convert object of shipments to an array, ensuring they are valid Shipment objects
    const shipmentValues = Object.values(results.processedShipments);
    allShipments = shipmentValues.filter((item): item is Shipment =>
      item &&
      typeof item === 'object' &&
      'id' in item // A simple check to ensure it's a shipment-like object
    );
  }

  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);

  // Helper to determine the best label URL and its format (PDF preferred)
  // Moved this function here to be accessible by LabelResultsTable
  const getLabelDownloadInfo = (shipment: Shipment) => {
    // Prioritize PDF if available
    if (shipment.label_urls?.pdf && shipment.label_urls.pdf.trim() !== '') {
      return { url: shipment.label_urls.pdf, format: 'pdf', type: 'PDF' };
    }
    // Fallback to PNG if available
    if (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') {
      return { url: shipment.label_urls.png, format: 'png', type: 'PNG' };
    }
    // Fallback to legacy label_url, try to infer format or default to PNG
    if (shipment.label_url && shipment.label_url.trim() !== '') {
      const urlLower = shipment.label_url.toLowerCase();
      if (urlLower.endsWith('.pdf')) {
        return { url: shipment.label_url, format: 'pdf', type: 'PDF' };
      }
      return { url: shipment.label_url, format: 'png', type: 'PNG' }; // Default to PNG if no clear extension
    }
    return null; // No label URL found
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
      link.download = filename; // This attribute forces a download and suggests a filename
      link.target = '_blank'; // Opens in a new tab/window before download, good for PDFs

      document.body.appendChild(link);
      link.click(); // Programmatically click the link to trigger download
      document.body.removeChild(link); // Clean up the temporary link element

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
        }, i * 500); // 500ms delay between each download
      }
    }

    toast.dismiss(); // Dismiss the loading toast
    setTimeout(() => {
      toast.success(`Started download of ${shipmentsWithLabels.length} labels (PDFs preferred)`);
    }, 1000 + (shipmentsWithLabels.length * 500)); // Give time for all downloads to potentially initiate
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
    <div className="space-y-6 font-sans"> {/* Added font-sans for Inter font */}
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

        {/* Download Buttons Section */}
        {hasLabels && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Your Labels</h4>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDownloadAllIndividualLabels}
                className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition duration-200 ease-in-out transform hover:scale-105 shadow-md"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Labels ({shipmentsWithLabels.length} {shipmentsWithLabels.length > 0 ? (getLabelDownloadInfo(shipmentsWithLabels[0])?.type || 'Files') : 'Files'})
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

      {/* New Clean Table Display */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(shipment: Shipment) => {
            const labelInfo = getLabelDownloadInfo(shipment);
            if (labelInfo) {
              const timestamp = Date.now();
              const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
              const filename = `shipping_label_${trackingCode || `shipment_${shipment.id || timestamp}`}.${labelInfo.format}`;
              downloadFile(labelInfo.url, filename);
            } else {
              toast.error('No label URL available for this shipment.');
            }
          }}
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


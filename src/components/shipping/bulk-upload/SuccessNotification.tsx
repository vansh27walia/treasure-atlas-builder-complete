
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';

// --- TYPE DEFINITIONS TO MATCH YOUR BACKEND RESPONSE ---

/**
 * Describes a single item within the `labels` array from your backend.
 */
interface LabelResult {
  shipment_id: string; // Your internal DB ID for the shipment
  status: string; // e.g., 'success_individual_png_saved', 'error_buy'
  recipient_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  label_urls: {
    png: string | null;
    pdf?: string | null;
    zpl?: string | null;
  };
  carrier?: string;
  service?: string;
  rate?: string; // Rate comes as a string, e.g., "12.34"
  easypost_id?: string;
  error?: string; // Error message for failed shipments
}

/**
 * Describes the entire JSON object returned by your Deno edge function.
 */
interface BulkUploadResult {
  status: string; // e.g., 'finished_processing'
  labels: LabelResult[];
  bulk_label_png_url: string | null;
  bulk_label_pdf_url: string | null;
}

// A more structured type for shipments that have a confirmed label URL
type ShipmentWithLabel = LabelResult & {
  labelUrl: string;
};

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onCreateLabels: () => void;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadSingleLabel,
  onCreateLabels,
  isCreatingLabels,
}) => {
  // --- MEMOIZED DATA PROCESSING ---

  // Memoize separating the successful and failed shipments from the main `labels` array.
  const [successfulShipments, failedShipments] = useMemo(() => {
    const successes: LabelResult[] = [];
    const failures: LabelResult[] = [];
    (results.labels || []).forEach(label => {
      if (label.status.startsWith('error')) {
        failures.push(label);
      } else {
        successes.push(label);
      }
    });
    return [successes, failures];
  }, [results.labels]);

  // Memoize the list of shipments that have a valid individual label URL.
  const shipmentsWithLabels: ShipmentWithLabel[] = useMemo(() => {
    return successfulShipments
      .map(shipment => ({
        ...shipment,
        labelUrl: (shipment.label_urls?.png || '').trim(),
      }))
      .filter((shipment): shipment is ShipmentWithLabel => !!shipment.labelUrl);
  }, [successfulShipments]);
  
  // Memoize the total shipping cost by summing the 'rate' of each successful shipment.
  const totalCost = useMemo(() => {
    return successfulShipments.reduce((sum, shipment) => {
      const rate = parseFloat(shipment.rate || '0');
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);
  }, [successfulShipments]);

  // Memoize boolean flags for cleaner conditional rendering in the JSX.
  const hasIndividualLabels = shipmentsWithLabels.length > 0;
  const hasBulkLabels = !!(results.bulk_label_png_url || results.bulk_label_pdf_url);
  const hasAnyLabels = hasIndividualLabels || hasBulkLabels;
  const hasProcessedItems = (results.labels || []).length > 0;
  const canCreateLabels = successfulShipments.length > 0 && !hasAnyLabels;

  // --- DOWNLOAD HANDLERS ---

  const downloadFile = async (url: string, filename: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download started for ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  const handleDownloadBulkPDF = () => {
    if (results.bulk_label_pdf_url) {
      downloadFile(results.bulk_label_pdf_url, `bulk_labels_${Date.now()}.pdf`);
    } else {
      toast.error('Bulk PDF label is not available.');
    }
  };

  const handleDownloadAllIndividualLabels = () => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No individual labels are available for download.');
      return;
    }
    const toastId = toast.loading(`Initiating ${shipmentsWithLabels.length} downloads...`);
    shipmentsWithLabels.forEach((shipment, index) => {
      setTimeout(() => {
        const trackingCode = shipment.tracking_number || shipment.shipment_id;
        downloadFile(shipment.labelUrl, `label_${trackingCode}.png`);
      }, index * 500); // Stagger downloads to prevent browser issues
    });
    setTimeout(() => {
        toast.success(`All ${shipmentsWithLabels.length} label downloads initiated.`, { id: toastId });
    }, shipmentsWithLabels.length * 500);
  };

  if (!hasProcessedItems) {
    return null; // Don't render anything if there are no results
  }

  // --- RENDER ---
  
  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasAnyLabels ? 'Labels Generated!' : 'Shipments Processed!'}
          </h3>
          <p className="text-green-700">
            {successfulShipments.length} of {results.labels.length} shipments processed successfully.
          </p>
        </div>
      </div>

      {failedShipments.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong><AlertTriangle className="inline-block h-4 w-4 mr-1" /> Note:</strong> {failedShipments.length} shipment(s) failed. See details at the bottom.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-800">{results.labels.length}</div>
          <div className="text-sm text-gray-600">Total Attempted</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{successfulShipments.length}</div>
          <div className="text-sm text-gray-600">Successfully Processed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
      </div>
      
      {/* Download Section */}
      {hasAnyLabels && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
           <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Labels</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasBulkLabels && (
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Consolidated File</h5>
                   <div className="flex flex-col gap-2">
                    {results.bulk_label_pdf_url && <Button onClick={handleDownloadBulkPDF} className="bg-blue-600 hover:bg-blue-700 text-white w-full"><File className="mr-2 h-4 w-4" /> Download All (PDF)</Button>}
                   </div>
                </div>
            )}
            {hasIndividualLabels && (
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Individual Files</h5>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleDownloadAllIndividualLabels} className="bg-purple-600 hover:bg-purple-700 text-white w-full"><Download className="mr-2 h-4 w-4" /> Download All (PNGs)</Button>
                  </div>
                </div>
            )}
           </div>
        </div>
      )}

      {/* Create Labels button (if applicable) */}
      {canCreateLabels && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <h4 className="font-semibold text-lg text-yellow-800 mb-2">Create Shipping Labels</h4>
          <Button onClick={onCreateLabels} disabled={isCreatingLabels} className="bg-blue-600 hover:bg-blue-700 text-white" size="lg">
            {isCreatingLabels ? 'Creating...' : 'Create Labels Now'}
          </Button>
        </div>
      )}

      {/* Successful Shipments Table */}
      {successfulShipments.length > 0 && (
        <div className="mt-6">
          <SuccessfulShipmentsTable
            shipments={successfulShipments}
            onDownloadSingleLabel={onDownloadSingleLabel}
          />
        </div>
      )}

      {/* Failed Shipments Details */}
      {failedShipments.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-red-800 mb-3">Failed Shipments</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-3">
            {failedShipments.map((failedItem) => (
              <div key={failedItem.shipment_id} className="text-sm font-mono p-2 bg-white rounded border border-red-100">
                <p className="font-semibold text-red-700">Shipment ID: <span className="font-medium text-gray-700">{failedItem.shipment_id}</span></p>
                <p className="text-red-600 mt-1"><strong>Error:</strong> {failedItem.error || 'An unknown error occurred.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SuccessNotification;
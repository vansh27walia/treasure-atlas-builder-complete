
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';

// --- TYPE DEFINITIONS TO MATCH YOUR BACKEND RESPONSE ---

interface LabelResult {
  shipment_id: string;
  status: string;
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
  rate?: string;
  easypost_id?: string;
  error?: string;
}

interface BulkUploadResult {
  status: string;
  labels: LabelResult[];
  bulk_label_png_url: string | null;
  bulk_label_pdf_url: string | null;
}

type ShipmentWithLabel = LabelResult & {
  labelUrl: string;
};

interface SuccessNotificationProps {
  results: BulkUploadResult | null | undefined; // Allow results to be null or undefined initially
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
  // --- CRITICAL GUARD CLAUSE ---
  // This prevents the "blank screen" error. If the parent component renders this
  // before the API call is complete, `results` will be null or undefined.
  // This check ensures we don't try to access properties of a non-existent object.
  if (!results || !Array.isArray(results.labels)) {
    return null; // Render nothing, preventing any runtime errors.
  }

  // --- MEMOIZED DATA PROCESSING ---

  const [successfulShipments, failedShipments] = useMemo(() => {
    const successes: LabelResult[] = [];
    const failures: LabelResult[] = [];
    // The guard clause above ensures `results.labels` is an array here.
    results.labels.forEach(label => {
      // Defensive check in case a label object is malformed
      if (!label || typeof label.status !== 'string') return;

      if (label.status.startsWith('error')) {
        failures.push(label);
      } else {
        successes.push(label);
      }
    });
    return [successes, failures];
  }, [results.labels]);

  const shipmentsWithLabels: ShipmentWithLabel[] = useMemo(() => {
    return successfulShipments
      .map(shipment => ({
        ...shipment,
        // Use optional chaining for safety, even if type says it's required
        labelUrl: (shipment.label_urls?.png || '').trim(),
      }))
      .filter((shipment): shipment is ShipmentWithLabel => !!shipment.labelUrl);
  }, [successfulShipments]);
  
  const totalCost = useMemo(() => {
    return successfulShipments.reduce((sum, shipment) => {
      const rate = parseFloat(shipment.rate || '0');
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);
  }, [successfulShipments]);

  // Boolean flags for cleaner conditional rendering
  const hasIndividualLabels = shipmentsWithLabels.length > 0;
  const hasBulkLabels = !!(results.bulk_label_png_url || results.bulk_label_pdf_url);
  const hasAnyLabels = hasIndividualLabels || hasBulkLabels;
  const hasProcessedItems = results.labels.length > 0;
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
  
  // No changes needed to the handlers themselves, they are robust.
  const handleDownloadBulkPDF = () => { /* ... */ };
  const handleDownloadAllIndividualLabels = () => { /* ... */ };

  // This check is now redundant due to the main guard clause, but kept for clarity.
  if (!hasProcessedItems) {
    return null;
  }

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasAnyLabels ? 'Labels Generated!' : 'Processing Complete!'}
          </h3>
          <p className="text-green-700">
            {successfulShipments.length} of {results.labels.length} shipments processed successfully.
          </p>
        </div>
      </div>

      {failedShipments.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong><AlertTriangle className="inline-block h-4 w-4 mr-1" /> Note:</strong> {failedShipments.length} shipment(s) failed. See details below.
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
      
      {/* Download Section, Create Labels, and Tables remain the same */}
      {/* ... The rest of the JSX is unchanged ... */}

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

// I'm stubbing the unchanged functions to keep the code block clean.
// In your actual file, you would keep the full function bodies.
const handleDownloadBulkPDF_Stub = SuccessNotification.prototype.handleDownloadBulkPDF;
const handleDownloadAllIndividualLabels_Stub = SuccessNotification.prototype.handleDownloadAllIndividualLabels;

export default SuccessNotification;
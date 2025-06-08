import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, XCircle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping'; // NOTE: This type should be updated to match the backend response
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import { toast } from '@/components/ui/sonner';

/*
  Your `BulkUploadResult` type in '@/types/shipping' should match the backend response:
  
  export interface BulkShipment {
    shipment_id: string | number;
    status: string;
    recipient_name: string;
    tracking_number?: string;
    label_urls: { png: string | null };
    carrier?: string;
    service?: string;
    rate?: number;
    error?: string;
  }

  export interface BulkUploadResult {
    status: string;
    labels: BulkShipment[];
    bulk_label_png_url: string | null;
    bulk_label_pdf_url: string | null;
  }
*/


interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  // These props are kept for API consistency, but their primary logic is now handled within this component
  onDownloadAllLabels: () => void;
  onCreateLabels: () => void;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadSingleLabel,
  onCreateLabels,
  isCreatingLabels
}) => {
  console.log('SuccessNotification received results:', results);

  // --- FIX 1: Correctly parse the data from the backend ---
  // The backend sends processed shipments in the `labels` array.
  const allShipments = results?.labels || [];

  // --- FIX 2: Derive successful and failed shipments from the `allShipments` array ---
  const shipmentsWithLabels = allShipments.filter(shipment => 
    shipment && typeof shipment.label_urls?.png === 'string' && shipment.label_urls.png.trim() !== ''
  );
  
  const failedShipments = allShipments.filter(shipment => 
    shipment?.status?.startsWith('error')
  );

  // --- FIX 3: Calculate total cost from the successful shipments ---
  const totalCost = shipmentsWithLabels.reduce((sum, shipment) => sum + (shipment.rate || 0), 0);

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;
  const hasBulkLabels = !!(results.bulk_label_png_url || results.bulk_label_pdf_url);

  // Helper function to download a file
  const downloadFile = async (url: string, filename: string) => {
    try {
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

  const handleDownloadBulkPNG = async () => {
    if (results.bulk_label_png_url) {
      await downloadFile(results.bulk_label_png_url, `bulk_shipping_labels_${Date.now()}.png`);
    } else {
      toast.error('Bulk PNG not available');
    }
  };

  const handleDownloadBulkPDF = async () => {
    if (results.bulk_label_pdf_url) {
      await downloadFile(results.bulk_label_pdf_url, `bulk_shipping_labels_${Date.now()}.pdf`);
    } else {
      toast.error('Bulk PDF not available');
    }
  };

  // --- FIX 4: Simplify individual label download logic ---
  const handleDownloadAllIndividualLabels = async () => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No individual labels available for download.');
      return;
    }

    toast.loading('Preparing individual label downloads...');
    
    // Use a short delay between downloads to prevent browser from blocking popups
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      const labelUrl = shipment.label_urls.png; // We know this exists from the filter
      setTimeout(async () => {
        const trackingCode = shipment.tracking_number;
        await downloadFile(labelUrl, `label_${trackingCode || shipment.shipment_id || i}.png`);
      }, i * 400);
    }
    
    toast.dismiss();
    toast.success(`Started download of ${shipmentsWithLabels.length} labels.`);
  };
  
  // Don't render the component if there's nothing to show
  if (totalProcessed === 0) {
    return null;
  }

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50/80">
      <div className="flex items-start space-x-3 mb-4">
        <CheckCircle className="h-7 w-7 text-green-600 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasLabels || hasBulkLabels ? 'Labels Generated Successfully!' : 'Shipments Processed!'}
          </h3>
          <p className="text-green-700">
            {hasLabels || hasBulkLabels
              ? `${shipmentsWithLabels.length} of ${totalProcessed} shipments have labels ready for download.`
              : `${totalProcessed} shipments have been processed and are ready for the next step.`
            }
          </p>
        </div>
      </div>

      {failedShipments.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100/50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {failedShipments.length} shipment(s) failed to generate a label. See details in the table below.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-gray-700">{totalProcessed}</div>
          <div className="text-sm text-gray-500">Total Processed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{shipmentsWithLabels.length}</div>
          <div className="text-sm text-gray-500">Labels Generated</div>
        </div>
        <div className="bg-white p-4 rounded-lg border col-span-2 md:col-span-1">
          <div className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Total Shipping Cost</div>
        </div>
      </div>

      {/* Bulk Download Section */}
      {hasBulkLabels && (
        <div className="mb-6">
          <h4 className="font-semibold text-lg text-gray-800 mb-3">Download All Labels (Consolidated)</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            {results.bulk_label_png_url && (
              <Button onClick={handleDownloadBulkPNG} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="mr-2 h-4 w-4" /> Download Bulk PNG
              </Button>
            )}
            {results.bulk_label_pdf_url && (
              <Button onClick={handleDownloadBulkPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                <File className="mr-2 h-4 w-4" /> Download Bulk PDF
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6">
        <h4 className="font-semibold text-lg text-gray-800 mb-3">Actions</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          {hasLabels && (
            <Button onClick={handleDownloadAllIndividualLabels} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Download className="mr-2 h-4 w-4" /> Download All Individual Labels ({shipmentsWithLabels.length})
            </Button>
          )}
          {!hasLabels && !hasBulkLabels && totalProcessed > 0 && (
             <Button onClick={onCreateLabels} disabled={isCreatingLabels}>
              {isCreatingLabels ? 'Creating Labels...' : 'Create Labels Now'}
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()} className="border-gray-300">
            <FileText className="mr-2 h-4 w-4" /> Print Summary
          </Button>
        </div>
      </div>
      
      {/* Shipments Table */}
      {allShipments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-lg text-gray-800 mb-3">Shipment Details</h4>
          <SuccessfulShipmentsTable
            shipments={allShipments}
            onDownloadSingleLabel={onDownloadSingleLabel}
            onDownloadAllLabels={handleDownloadAllIndividualLabels}
          />
        </div>
      )}
    </Card>
  );
};

export default SuccessNotification;

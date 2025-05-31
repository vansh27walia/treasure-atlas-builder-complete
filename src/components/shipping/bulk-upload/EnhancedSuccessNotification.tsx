
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, RotateCcw } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import BulkLabelsTable from './BulkLabelsTable';
import { toast } from '@/components/ui/sonner';

interface EnhancedSuccessNotificationProps {
  results: BulkUploadResult;
  batchId?: string;
  batchLabelUrl?: string;
}

const EnhancedSuccessNotification: React.FC<EnhancedSuccessNotificationProps> = ({
  results,
  batchId,
  batchLabelUrl
}) => {
  // Transform shipments into the format expected by BulkLabelsTable
  const labels = results.processedShipments
    .filter(shipment => shipment.label_url && shipment.tracking_code)
    .map(shipment => ({
      shipment_id: shipment.id,
      recipient_name: shipment.details?.to_name || shipment.recipient,
      drop_off_address: `${shipment.details?.to_street1 || ''}, ${shipment.details?.to_city || ''}, ${shipment.details?.to_state || ''} ${shipment.details?.to_zip || ''}`.trim().replace(/^,\s*/, '').replace(/,\s*$/, ''),
      tracking_number: shipment.tracking_code || shipment.trackingCode || '',
      tracking_url: `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.tracking_code || shipment.trackingCode}`,
      label_url: shipment.label_url || '',
      carrier: shipment.carrier,
      service: shipment.service,
      rate: shipment.rate
    }));

  const handleDownloadLabel = (labelUrl: string) => {
    try {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = labelUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  };

  const handleDownloadBulkLabels = (bulkLabelUrl: string) => {
    try {
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = bulkLabelUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = `bulk_labels_${batchId || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error('Failed to download bulk labels');
    }
  };

  const handleStartOver = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-green-800">
                Bulk Label Creation Successful!
              </h2>
              <p className="text-green-700 mt-1">
                Successfully created {labels.length} shipping labels
                {batchId && (
                  <span className="text-sm text-green-600 block">
                    Batch ID: {batchId}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Start Over
          </Button>
        </div>
      </Card>

      {/* Labels Table */}
      {labels.length > 0 ? (
        <BulkLabelsTable
          labels={labels}
          bulkLabelUrl={batchLabelUrl}
          onDownloadLabel={handleDownloadLabel}
          onDownloadBulkLabels={handleDownloadBulkLabels}
        />
      ) : (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No labels were successfully created.</p>
          <Button
            onClick={handleStartOver}
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </Card>
      )}
    </div>
  );
};

export default EnhancedSuccessNotification;

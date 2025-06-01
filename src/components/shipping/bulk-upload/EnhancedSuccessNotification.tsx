
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import BulkLabelsTable from './BulkLabelsTable';

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
  console.log('EnhancedSuccessNotification rendered with:', { results, batchId, batchLabelUrl });

  if (!results) {
    console.error('EnhancedSuccessNotification: No results provided');
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Error: No results data available</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload Page
        </Button>
      </Card>
    );
  }

  // Handle both old structure (processedShipments) and new structure (labels from backend)
  let shipments = [];
  let bulkPngUrl = null;
  let bulkPdfUrl = null;

  if (results.processedShipments && Array.isArray(results.processedShipments)) {
    // Old structure - use processedShipments
    shipments = results.processedShipments;
  } else if (results.labels && Array.isArray(results.labels)) {
    // New structure from backend - use labels array
    shipments = results.labels.map(label => ({
      id: label.shipment_id || 'unknown',
      recipient: label.recipient_name || 'Unknown Recipient',
      label_url: label.label_urls?.png || '',
      tracking_code: label.tracking_number || '',
      carrier: label.carrier || 'Unknown',
      service: label.service || 'Unknown',
      rate: typeof label.rate === 'number' ? label.rate : parseFloat(String(label.rate || '0')),
      details: {
        to_name: label.recipient_name || 'Unknown Recipient',
        to_street1: label.drop_off_address?.split(',')[0] || '',
        to_city: label.drop_off_address?.split(',')[1]?.trim() || '',
        to_state: label.drop_off_address?.split(',')[2]?.trim() || '',
        to_zip: label.drop_off_address?.split(',')[3]?.trim() || ''
      },
      status: label.status === 'success_individual_png_saved' ? 'completed' : 'error'
    }));

    // Extract bulk URLs from backend response
    bulkPngUrl = results.bulk_label_png_url;
    bulkPdfUrl = results.bulk_label_pdf_url;
  }

  console.log('Processed shipments:', shipments);
  console.log('Bulk URLs:', { bulkPngUrl, bulkPdfUrl });

  if (!shipments || shipments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">No labels were successfully created.</p>
        <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  // Filter only successful labels
  const successfulLabels = shipments.filter(shipment => 
    shipment.status === 'completed' && shipment.label_url
  );

  // Transform shipments into the format expected by BulkLabelsTable
  const labels = successfulLabels.map(shipment => ({
    shipment_id: shipment.id || 'unknown',
    recipient_name: shipment.recipient || shipment.details?.to_name || 'Unknown Recipient',
    drop_off_address: (() => {
      const details = shipment.details;
      if (!details) return 'Address not available';
      
      const parts = [
        details.to_street1 || '',
        details.to_city || '',
        details.to_state || '',
        details.to_zip || ''
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'Address not available';
    })(),
    tracking_number: shipment.tracking_code || '',
    tracking_url: shipment.tracking_code ? 
      `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.tracking_code}` : '',
    label_url: shipment.label_url || '',
    carrier: shipment.carrier || 'Unknown',
    service: shipment.service || 'Unknown',
    rate: shipment.rate || 0
  }));

  const handleStartOver = () => {
    console.log('Starting over - reloading page');
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
          bulkLabelPngUrl={bulkPngUrl}
          bulkLabelPdfUrl={bulkPdfUrl}
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

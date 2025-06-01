
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
  console.log('EnhancedSuccessNotification rendered with:', { results, batchId, batchLabelUrl });

  // Safety check for results
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

  // Try to get labels from either the labels array or transform processedShipments
  let labels = [];
  
  if (results.labels && Array.isArray(results.labels)) {
    // Use the labels array if available
    labels = results.labels;
    console.log('Using labels array from results:', labels);
  } else if (results.processedShipments && Array.isArray(results.processedShipments)) {
    // Transform shipments into the format expected by BulkLabelsTable
    labels = results.processedShipments
      .filter(shipment => {
        console.log('Filtering shipment:', shipment);
        return shipment && (shipment.label_url || shipment.tracking_code);
      })
      .map(shipment => {
        try {
          const label = {
            shipment_id: shipment.id || 'unknown',
            recipient_name: shipment.details?.to_name || shipment.recipient || 'Unknown Recipient',
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
            tracking_number: shipment.tracking_code || shipment.trackingCode || '',
            tracking_url: shipment.tracking_code ? 
              `https://tools.usps.com/go/TrackConfirmAction?tLabels=${shipment.tracking_code}` : '',
            label_url: shipment.label_url || '',
            label_urls: shipment.label_urls || {},
            carrier: shipment.carrier || 'Unknown',
            service: shipment.service || 'Unknown',
            rate: shipment.rate || 0
          };
          
          console.log('Transformed label:', label);
          return label;
        } catch (error) {
          console.error('Error transforming shipment:', shipment, error);
          return {
            shipment_id: shipment?.id || 'error',
            recipient_name: 'Error processing shipment',
            drop_off_address: 'Error',
            tracking_number: '',
            tracking_url: '',
            label_url: '',
            label_urls: {},
            carrier: 'Error',
            service: 'Error',
            rate: 0
          };
        }
      });
    
    console.log('Transformed labels from processedShipments:', labels);
  }

  const handleDownloadLabel = (labelUrl: string) => {
    console.log('handleDownloadLabel called with:', labelUrl);
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
    console.log('handleDownloadBulkLabels called with:', bulkLabelUrl);
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
    console.log('Starting over - reloading page');
    window.location.reload();
  };

  // Use bulk label URL from results if available, otherwise use the passed batchLabelUrl
  const bulkDownloadUrl = results.bulk_label_png_url || results.bulk_label_pdf_url || batchLabelUrl;

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
          bulkLabelUrl={bulkDownloadUrl}
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

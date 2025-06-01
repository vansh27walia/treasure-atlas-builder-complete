
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

  // Safety check for processedShipments
  if (!results.processedShipments || !Array.isArray(results.processedShipments)) {
    console.error('EnhancedSuccessNotification: Invalid processedShipments:', results.processedShipments);
    return (
      <Card className="p-6 text-center">
        <p className="text-red-600">Error: Invalid shipments data</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reload Page
        </Button>
      </Card>
    );
  }

  // Transform shipments into the format expected by BulkLabelsTable
  const labels = results.processedShipments
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
          label_png_url: shipment.label_png_url || shipment.label_url || '',
          carrier: shipment.carrier || 'Unknown',
          service: shipment.service || 'Unknown',
          rate: shipment.rate ? shipment.rate.toString() : '0'
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
          label_png_url: '',
          carrier: 'Error',
          service: 'Error',
          rate: '0'
        };
      }
    });

  console.log('Transformed labels:', labels);

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

  const handleDownloadPngLabel = (pngUrl: string) => {
    console.log('handleDownloadPngLabel called with:', pngUrl);
    try {
      const link = document.createElement('a');
      link.href = pngUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('PNG Download error:', error);
      toast.error('Failed to download PNG label');
    }
  };

  const handleDownloadBulkLabels = (bulkLabelUrl: string) => {
    console.log('handleDownloadBulkLabels called with:', bulkLabelUrl);
    try {
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

  const handleDownloadBulkPngLabels = () => {
    console.log('handleDownloadBulkPngLabels called');
    try {
      // Download all PNG labels individually
      labels.forEach((label, index) => {
        if (label.label_png_url) {
          setTimeout(() => {
            handleDownloadPngLabel(label.label_png_url);
          }, index * 500); // Stagger downloads
        }
      });
      toast.success(`Downloading ${labels.length} PNG labels`);
    } catch (error) {
      console.error('Bulk PNG download error:', error);
      toast.error('Failed to download bulk PNG labels');
    }
  };

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
          
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadBulkPngLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All PNG
            </Button>
            
            <Button
              variant="outline"
              onClick={handleStartOver}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
          </div>
        </div>
      </Card>

      {/* Labels Table */}
      {labels.length > 0 ? (
        <BulkLabelsTable
          labels={labels}
          bulkLabelUrl={batchLabelUrl}
          onDownloadLabel={handleDownloadLabel}
          onDownloadPngLabel={handleDownloadPngLabel}
          onDownloadBulkLabels={handleDownloadBulkLabels}
          onDownloadBulkPngLabels={handleDownloadBulkPngLabels}
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

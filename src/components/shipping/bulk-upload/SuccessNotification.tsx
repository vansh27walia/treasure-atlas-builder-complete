import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, Eye, Printer } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import BatchLabelDownloads from './BatchLabelDownloads';
import LabelPrintPreview from './LabelPrintPreview';
import { toast } from '@/components/ui/sonner';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string, format?: string) => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  const handleDownloadAllByFormat = async (format: 'png' | 'pdf' | 'zpl') => {
    console.log(`Downloading all ${format.toUpperCase()} labels, count:`, shipmentsWithLabels.length);
    
    const availableLabels = shipmentsWithLabels.filter(shipment => {
      const url = shipment.label_urls?.[format] || (format === 'png' ? shipment.label_url : null);
      return url && url.trim() !== '';
    });

    if (availableLabels.length === 0) {
      toast.error(`No ${format.toUpperCase()} labels available for download`);
      return;
    }

    toast.loading(`Starting download of ${availableLabels.length} ${format.toUpperCase()} labels...`);
    
    for (let i = 0; i < availableLabels.length; i++) {
      const shipment = availableLabels[i];
      const labelUrl = shipment.label_urls?.[format] || (format === 'png' ? shipment.label_url : null);
      
      if (labelUrl && labelUrl.trim() !== '') {
        try {
          setTimeout(async () => {
            const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
            await downloadFile(labelUrl, `label_${trackingCode || `shipment_${i + 1}`}.${format}`);
          }, i * 500);
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    setTimeout(() => {
      toast.success(`Started download of ${availableLabels.length} ${format.toUpperCase()} labels`);
    }, 1000);
  };

  const handleBatchDownload = async (format: 'png' | 'pdf' | 'zpl') => {
    console.log(`Downloading batch ${format.toUpperCase()} labels, count:`, shipmentsWithLabels.length);
    
    const availableLabels = shipmentsWithLabels.filter(shipment => {
      const url = shipment.label_urls?.[format] || (format === 'png' ? shipment.label_url : null);
      return url && url.trim() !== '';
    });

    if (availableLabels.length === 0) {
      toast.error(`No ${format.toUpperCase()} labels available for download`);
      return;
    }

    // For batch downloads, we should use the backend batch URLs if available
    // or create a batch download request
    toast.loading(`Preparing batch download of ${availableLabels.length} ${format.toUpperCase()} labels...`);
    
    try {
      // Check if we have a batch URL for this format
      const batchUrl = results[`batch_${format}_url`];
      
      if (batchUrl) {
        // Download the batch file directly
        const link = document.createElement('a');
        link.href = batchUrl;
        link.download = `batch_labels_${Date.now()}.${format === 'zpl' ? 'zip' : format}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Downloaded batch ${format.toUpperCase()} file`);
      } else {
        // Fallback to individual downloads with delay
        for (let i = 0; i < availableLabels.length; i++) {
          const shipment = availableLabels[i];
          const labelUrl = shipment.label_urls?.[format] || (format === 'png' ? shipment.label_url : null);
          
          if (labelUrl && labelUrl.trim() !== '') {
            setTimeout(() => {
              const link = document.createElement('a');
              link.href = labelUrl;
              link.download = `label_${shipment.tracking_code || `shipment_${i + 1}`}.${format}`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }, i * 500);
          }
        }
        
        toast.success(`Started download of ${availableLabels.length} ${format.toUpperCase()} labels`);
      }
    } catch (error) {
      console.error('Batch download error:', error);
      toast.error(`Failed to download batch ${format.toUpperCase()} labels`);
    }
    
    toast.dismiss();
  };

  const handlePrintPreview = () => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for preview');
      return;
    }
    setShowPrintPreview(true);
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
              {hasLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created with multiple format options.`
                : `${displayTotal} shipments have been processed and are ready for label creation.`
              }
              {displayFailed > 0 && ` ${displayFailed} shipments failed.`}
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

        {/* Enhanced Batch Download Section */}
        {hasLabels && (
          <BatchLabelDownloads
            results={results}
            onDownloadBatch={handleBatchDownload}
            onPrintPreview={handlePrintPreview}
          />
        )}

        {/* Create Labels Button */}
        {!hasLabels && displayTotal > 0 && (
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

      {/* Enhanced Table Display */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={onDownloadSingleLabel}
        />
      )}

      {/* Print Preview Modal */}
      <LabelPrintPreview
        open={showPrintPreview}
        onOpenChange={setShowPrintPreview}
        results={results}
        onDownloadBatch={handleBatchDownload}
      />

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

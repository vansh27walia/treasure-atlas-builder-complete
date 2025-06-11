
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, Truck, Calendar } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import BatchLabelDownloads from '@/components/shipping/BatchLabelDownloads';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

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
  console.log('SuccessNotification received results:', results);

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

  // Don't show if no data
  if (!shouldShowNotification) {
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  // Use batch URLs from results - these should come from the backend now
  const batchUrls = results.batchUrls || {
    pdf: results.bulk_label_pdf_url || results.batchPdfUrl,
    png: results.bulk_label_png_url || results.batchPngUrl,
    zpl: results.bulk_label_zpl_url || results.batchZplUrl,
  };

  // Calculate delivery statistics
  const deliveryStats = allShipments.reduce((stats, shipment) => {
    if (shipment.delivery_days) {
      stats.totalDays += shipment.delivery_days;
      stats.count += 1;
      if (shipment.delivery_days <= 2) stats.express += 1;
      else if (shipment.delivery_days <= 5) stats.standard += 1;
      else stats.economy += 1;
    }
    return stats;
  }, { totalDays: 0, count: 0, express: 0, standard: 0, economy: 0 });

  const avgDeliveryDays = deliveryStats.count > 0 ? (deliveryStats.totalDays / deliveryStats.count).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {hasLabels ? 'Batch Labels Created Successfully!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and consolidated into batch files.`
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

        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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

          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-1 mb-1">
              <Truck className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{avgDeliveryDays}</div>
            </div>
            <div className="text-sm text-gray-600">Avg. Delivery Days</div>
          </div>
        </div>

        {/* Delivery Speed Breakdown */}
        {deliveryStats.count > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Delivery Speed Breakdown
            </h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">Express (≤2 days)</Badge>
                <span className="font-medium">{deliveryStats.express} shipments</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">Standard (3-5 days)</Badge>
                <span className="font-medium">{deliveryStats.standard} shipments</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">Economy (6+ days)</Badge>
                <span className="font-medium">{deliveryStats.economy} shipments</span>
              </div>
            </div>
          </div>
        )}

        {/* Batch Download Section - Only show if we have labels */}
        {hasLabels && batchUrls && (batchUrls.pdf || batchUrls.png || batchUrls.zpl) && (
          <BatchLabelDownloads
            batchUrls={batchUrls}
            shipmentCount={displaySuccessful}
          />
        )}

        {/* Create Labels Button - Only show if no labels exist yet */}
        {!hasLabels && displayTotal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and download shipping labels with consolidated batch files.
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

      {/* Individual Labels Table */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string, format?: string) => {
            if (url && url.trim() !== '') {
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              toast.success(`Downloaded ${filename}`);
            } else {
              toast.error('Invalid label URL - cannot download');
            }
          }}
        />
      )}

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

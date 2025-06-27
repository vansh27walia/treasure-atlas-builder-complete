
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, PrinterIcon, Mail, Package } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';

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
  const [showEmailModal, setShowEmailModal] = useState(false);

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

  const handleDownloadConsolidated = (format: 'pdf' | 'png' | 'zpl' | 'epl') => {
    if (!results.batchResult?.consolidatedLabelUrls[format]) {
      toast.error(`${format.toUpperCase()} consolidated labels not available`);
      return;
    }

    const link = document.createElement('a');
    link.href = results.batchResult.consolidatedLabelUrls[format]!;
    link.download = `consolidated_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded consolidated ${format.toUpperCase()} labels`);
  };

  const handleDownloadManifest = () => {
    if (!results.batchResult?.scanFormUrl) {
      toast.error('Scan form not available');
      return;
    }

    const link = document.createElement('a');
    link.href = results.batchResult.scanFormUrl;
    link.download = `pickup_manifest_${Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Downloaded pickup manifest');
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
              {hasLabels ? 'Labels Created Successfully!' : 'Shipments Processed Successfully!'}
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

        {/* Batch Label Creation Controls */}
        {hasLabels && results.batchResult && (
          <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-4">
              <Package className="h-6 w-6 text-blue-600 mr-3" />
              <h4 className="font-semibold text-lg text-blue-800">Batch Label Actions</h4>
            </div>
            
            {/* Consolidated Download Options */}
            <div className="mb-6">
              <h5 className="font-medium text-blue-700 mb-3">Download Consolidated Labels</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={() => handleDownloadConsolidated('pdf')}
                  className="bg-red-600 hover:bg-red-700 text-white flex items-center justify-center h-16"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <div className="text-center">
                    <div className="font-semibold">PDF</div>
                    <div className="text-xs opacity-90">All Labels</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDownloadConsolidated('png')}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center h-16"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.png}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <div className="text-center">
                    <div className="font-semibold">PNG</div>
                    <div className="text-xs opacity-90">All Labels</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDownloadConsolidated('zpl')}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center h-16"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.zpl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <div className="text-center">
                    <div className="font-semibold">ZPL</div>
                    <div className="text-xs opacity-90">All Labels</div>
                  </div>
                </Button>

                <Button
                  onClick={() => handleDownloadConsolidated('epl')}
                  className="bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center h-16"
                  disabled={!results.batchResult?.consolidatedLabelUrls?.epl}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <div className="text-center">
                    <div className="font-semibold">EPL</div>
                    <div className="text-xs opacity-90">All Labels</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowPrintPreview(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <PrinterIcon className="mr-2 h-4 w-4" />
                Print Preview All Labels
              </Button>

              <Button
                onClick={() => setShowEmailModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Labels
              </Button>

              {results.batchResult?.scanFormUrl && (
                <Button
                  onClick={handleDownloadManifest}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download Manifest
                </Button>
              )}
            </div>
          </div>
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

      {/* Individual Labels Table */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url: string, format?: string) => {
            if (url && url.trim() !== '') {
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              onDownloadSingleLabel(url, format);
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

      {/* Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={results.batchResult || null}
      />

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={results.batchResult || null}
      />
    </div>
  );
};

export default SuccessNotification;

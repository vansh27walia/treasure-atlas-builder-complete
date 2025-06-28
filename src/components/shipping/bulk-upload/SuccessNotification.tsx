
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, PrinterIcon, Mail, Package, Sparkles, FileDown } from 'lucide-react';
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

  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');
  
  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    failedShipments: failedShipments.length
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;
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

  if (!shouldShowNotification) {
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center py-8 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl border border-green-200">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {hasLabels ? 'Labels Created Successfully!' : 'Shipments Processed Successfully!'}
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto">
          {hasLabels
            ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and are ready for download.`
            : `${displayTotal} shipments have been processed and are ready for label creation.`
          }
          {displayFailed > 0 && ` ${displayFailed} shipments encountered issues.`}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">{displayTotal}</div>
          <div className="font-medium text-blue-800 text-sm">Total Processed</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">{displaySuccessful}</div>
          <div className="font-medium text-green-800 text-sm">Labels Created</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-2xl font-bold text-red-600 mb-1">{displayFailed}</div>
          <div className="font-medium text-red-800 text-sm">Failed</div>
        </Card>
        
        <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-2xl font-bold text-purple-600 mb-1">${results.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="font-medium text-purple-800 text-sm">Total Cost</div>
        </Card>
      </div>

      {/* Consolidated Batch Label Actions */}
      {hasLabels && results.batchResult && (
        <Card className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center mr-3">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Batch Label Downloads</h2>
              <p className="text-gray-600">Download all your labels in various formats</p>
            </div>
          </div>
          
          {/* Consolidated Download Options */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Consolidated Label Downloads</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                onClick={() => handleDownloadConsolidated('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white h-16 flex-col"
                disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
              >
                <FileDown className="h-5 w-5 mb-1" />
                <div className="text-center">
                  <div className="font-bold text-sm">PDF</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadConsolidated('png')}
                className="bg-purple-600 hover:bg-purple-700 text-white h-16 flex-col"
                disabled={!results.batchResult?.consolidatedLabelUrls?.png}
              >
                <FileDown className="h-5 w-5 mb-1" />
                <div className="text-center">
                  <div className="font-bold text-sm">PNG</div>
                  <div className="text-xs opacity-90">All Labels</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadConsolidated('zpl')}
                className="bg-blue-600 hover:bg-blue-700 text-white h-16 flex-col"
                disabled={!results.batchResult?.consolidatedLabelUrls?.zpl}
              >
                <FileDown className="h-5 w-5 mb-1" />
                <div className="text-center">
                  <div className="font-bold text-sm">ZPL</div>
                  <div className="text-xs opacity-90">Thermal</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDownloadConsolidated('epl')}
                className="bg-orange-600 hover:bg-orange-700 text-white h-16 flex-col"
                disabled={!results.batchResult?.consolidatedLabelUrls?.epl}
              >
                <FileDown className="h-5 w-5 mb-1" />
                <div className="text-center">
                  <div className="font-bold text-sm">EPL</div>
                  <div className="text-xs opacity-90">Thermal</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => setShowPrintPreview(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print Preview All Labels
            </Button>

            <Button
              onClick={() => setShowEmailModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Labels
            </Button>

            {results.batchResult?.scanFormUrl && (
              <Button
                onClick={handleDownloadManifest}
                variant="outline"
                className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download Manifest
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create Labels Section - Only if no labels exist */}
      {!hasLabels && displayTotal > 0 && (
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <div className="text-center">
            <Package className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-3">Ready to Create Labels</h2>
            <p className="text-gray-700 mb-4 max-w-2xl mx-auto">
              Your shipments have been processed successfully. Click below to create and download all shipping labels at once.
            </p>
            <Button 
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              size="lg"
            >
              {isCreatingLabels ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Labels...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-5 w-5" />
                  Create All Labels Now
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Labels Table */}
      {allShipments.length > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Individual Label Management</h2>
            <p className="text-gray-600 text-sm mt-1">View and download individual shipping labels for each shipment</p>
          </div>
          <LabelResultsTable
            shipments={allShipments}
            onDownloadLabel={(url: string, format?: string) => {
              if (url && url.trim() !== '') {
                onDownloadSingleLabel(url, format);
              } else {
                toast.error('Invalid label URL - cannot download');
              }
            }}
          />
        </Card>
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-4 border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white font-bold text-xs">{results.failedShipments.length}</span>
            </div>
            Failed Shipments Details
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded border-l-4 border-red-400">
                <div className="font-semibold text-red-800 text-sm">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}
                </div>
                <div className="text-red-600 text-xs mt-1">{failed.details || failed.error}</div>
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

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, PrinterIcon, Mail, Package, Sparkles, File, FileArchive, Eye } from 'lucide-react';
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
    allShipments = shipmentValues.filter(item => item && typeof item === 'object' && 'id' in item);
  }
  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);

  // Count shipments with labels
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasLabel = !!(shipment.label_url && shipment.label_url.trim() !== '' || shipment.label_urls?.png && shipment.label_urls.png.trim() !== '' || shipment.status === 'completed');
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
    <div className="space-y-8">
      {/* Success Header - Enhanced Design */}
      <div className="text-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl px-0 py-[8px]">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {hasLabels ? 'Labels Created Successfully!' : 'Shipments Processed Successfully!'}
        </h1>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          {hasLabels ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and are ready for download.` : `${displayTotal} shipments have been processed and are ready for label creation.`}
          {displayFailed > 0 && ` ${displayFailed} shipments encountered issues.`}
        </p>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">{displayTotal}</div>
          <div className="font-medium text-blue-800">Total Processed</div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <div className="text-3xl font-bold text-green-600 mb-2">{displaySuccessful}</div>
          <div className="font-medium text-green-800">Labels Created</div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <div className="text-3xl font-bold text-red-600 mb-2">{displayFailed}</div>
          <div className="font-medium text-red-800">Failed</div>
        </Card>
        
        <Card className="p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <div className="text-3xl font-bold text-purple-600 mb-2">${results.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="font-medium text-purple-800">Total Cost</div>
        </Card>
      </div>

      {/* Enhanced Consolidated Download Section - Moved to Top Priority */}
      {hasLabels && results.batchResult && (
        <Card className="p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 border-2 border-indigo-300 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center mr-6 shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Consolidated Label Downloads</h2>
              <p className="text-lg text-gray-600">Download all your labels in one file or send via email</p>
            </div>
          </div>
          
          {/* Primary Download Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Button 
              onClick={() => handleDownloadConsolidated('pdf')} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-24 flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
              disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
              size="lg"
            >
              <File className="h-8 w-8 mb-3" />
              <div className="text-center">
                <div className="font-bold text-lg">PDF Download</div>
                <div className="text-sm opacity-90">All Labels Combined</div>
              </div>
            </Button>

            <Button 
              onClick={() => setShowPrintPreview(true)} 
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white h-24 flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
              size="lg"
            >
              <Eye className="h-8 w-8 mb-3" />
              <div className="text-center">
                <div className="font-bold text-lg">Print Preview</div>
                <div className="text-sm opacity-90">View & Print All</div>
              </div>
            </Button>

            <Button 
              onClick={() => setShowEmailModal(true)} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-24 flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
              size="lg"
            >
              <Mail className="h-8 w-8 mb-3" />
              <div className="text-center">
                <div className="font-bold text-lg">Email Labels</div>
                <div className="text-sm opacity-90">Send to Recipients</div>
              </div>
            </Button>

            {results.batchResult?.scanFormUrl && (
              <Button 
                onClick={handleDownloadManifest} 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white h-24 flex-col shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105" 
                size="lg"
              >
                <FileText className="h-8 w-8 mb-3" />
                <div className="text-center">
                  <div className="font-bold text-lg">Manifest</div>
                  <div className="text-sm opacity-90">Pickup Form</div>
                </div>
              </Button>
            )}
          </div>

          {/* Secondary Format Downloads */}
          <div className="border-t border-indigo-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Additional Formats</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => handleDownloadConsolidated('zpl')}
                variant="outline"
                className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50 shadow-lg"
                disabled={!results.batchResult?.consolidatedLabelUrls?.zpl}
              >
                <FileArchive className="h-4 w-4 mr-2" />
                ZPL Thermal
              </Button>

              <Button
                onClick={() => handleDownloadConsolidated('epl')}
                variant="outline"
                className="border-2 border-orange-500 text-orange-700 hover:bg-orange-50 shadow-lg"
                disabled={!results.batchResult?.consolidatedLabelUrls?.epl}
              >
                <FileArchive className="h-4 w-4 mr-2" />
                EPL Thermal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Labels Section - Only if no labels exist */}
      {!hasLabels && displayTotal > 0 && (
        <Card className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-lg">
          <div className="text-center">
            <Package className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Create Labels</h2>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Your shipments have been processed successfully. Click below to create and download all shipping labels at once.
            </p>
            <Button onClick={onCreateLabels} disabled={isCreatingLabels} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" size="lg">
              {isCreatingLabels ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating Labels...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-6 w-6" />
                  Create All Labels Now
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Individual Labels Table */}
      {allShipments.length > 0 && (
        <Card className="shadow-lg border-0">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Individual Label Management</h2>
            <p className="text-gray-600 mt-1">View and download individual shipping labels for each shipment</p>
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
        <Card className="p-6 border-red-200 shadow-lg">
          <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">{results.failedShipments.length}</span>
            </div>
            Failed Shipments Details
          </h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
            {results.failedShipments.map((failed, index) => <div key={index} className="mb-3 last:mb-0 p-3 bg-white rounded-lg border-l-4 border-red-400 shadow-sm">
                <div className="font-semibold text-red-800">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}
                </div>
                <div className="text-red-600 text-sm mt-1">{failed.details || failed.error}</div>
              </div>)}
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

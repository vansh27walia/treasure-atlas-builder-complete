import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, PrinterIcon, Mail, Package, Sparkles, Eye, File, FileImage, FileArchive } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import LabelResultsTable from './LabelResultsTable';
import { toast } from '@/components/ui/sonner';
import BatchPrintPreviewModal from '@/components/shipping/BatchPrintPreviewModal';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';
import EnhancedPrintPreview from '@/components/shipping/EnhancedPrintPreview';

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
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  
  console.log('SuccessNotification received results:', results);

  // shipment processing logic

  let allShipments = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments;
  } else if (results.processedShipments && typeof results.processedShipments === 'object') {
    const shipmentValues = Object.values(results.processedShipments);
    allShipments = shipmentValues.filter(item => item && typeof item === 'object' && 'id' in item);
  }

  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasLabel = !!(shipment.label_url && shipment.label_url.trim() !== '' || shipment.label_urls?.png && shipment.label_urls.png.trim() !== '' || shipment.status === 'completed');
    return hasLabel;
  });

  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');
  
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

      {/* Enhanced Batch Label Actions - Improved Layout */}
      {hasLabels && results.batchResult && (
        <Card className="p-8 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 shadow-xl">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mr-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Consolidated Label Management</h2>
              <p className="text-gray-600">Download, print, or email all your labels in one place</p>
            </div>
          </div>

          {/* Print Preview Section - Top Priority */}
          <div className="mb-8 p-6 bg-white rounded-xl border border-purple-200 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Print Preview & Management</h3>
                <p className="text-gray-600 text-sm">Preview and print all labels with format options</p>
              </div>
            </div>
            
            {results.batchResult?.consolidatedLabelUrls?.pdf ? (
              <Button 
                onClick={() => setShowBatchPreview(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg h-14 text-lg font-semibold rounded-lg"
              >
                <Eye className="mr-3 h-6 w-6" />
                Print Preview All Labels
              </Button>
            ) : (
              <Button disabled className="w-full h-14 text-lg rounded-lg">
                <Eye className="mr-3 h-6 w-6" />
                Print Preview Unavailable
              </Button>
            )}
          </div>

          {/* Improved Action Buttons Grid - Better Styling */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PDF Download */}
            <div className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-xl border-red-300 bg-red-50 hover:bg-red-100">
              <File className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h4 className="font-bold text-lg mb-2 text-red-800">PDF Format</h4>
              <p className="text-sm text-red-600 mb-4">Complete consolidated labels</p>
              <Button 
                onClick={() => handleDownloadConsolidated('pdf')} 
                className="bg-red-600 hover:bg-red-700 text-white w-full h-12 rounded-lg font-semibold shadow-md" 
                disabled={!results.batchResult?.consolidatedLabelUrls?.pdf}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* ZPL Download */}
            <div className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-xl border-blue-300 bg-blue-50 hover:bg-blue-100">
              <FileArchive className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h4 className="font-bold text-lg mb-2 text-blue-800">ZPL Format</h4>
              <p className="text-sm text-blue-600 mb-4">For thermal printers</p>
              <Button 
                onClick={() => handleDownloadConsolidated('zpl')} 
                className="bg-blue-600 hover:bg-blue-700 text-white w-full h-12 rounded-lg font-semibold shadow-md" 
                disabled={!results.batchResult?.consolidatedLabelUrls?.zpl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download ZPL
              </Button>
            </div>

            {/* EPL Download */}
            <div className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-xl border-orange-300 bg-orange-50 hover:bg-orange-100">
              <FileArchive className="h-12 w-12 mx-auto mb-4 text-orange-600" />
              <h4 className="font-bold text-lg mb-2 text-orange-800">EPL Format</h4>
              <p className="text-sm text-orange-600 mb-4">Alternative thermal format</p>
              <Button 
                onClick={() => handleDownloadConsolidated('epl')} 
                className="bg-orange-600 hover:bg-orange-700 text-white w-full h-12 rounded-lg font-semibold shadow-md" 
                disabled={!results.batchResult?.consolidatedLabelUrls?.epl}
              >
                <Download className="h-4 w-4 mr-2" />
                Download EPL
              </Button>
            </div>

            {/* Email Button */}
            <div className="p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-xl border-green-300 bg-green-50 hover:bg-green-100">
              <Mail className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h4 className="font-bold text-lg mb-2 text-green-800">Email Labels</h4>
              <p className="text-sm text-green-600 mb-4">Send to recipients</p>
              <Button 
                onClick={() => setShowEmailModal(true)} 
                className="bg-green-600 hover:bg-green-700 text-white w-full h-12 rounded-lg font-semibold shadow-md"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>

          {/* Manifest Download */}
          {results.batchResult?.scanFormUrl && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <span className="font-bold text-blue-800 text-lg">Pickup Manifest Available</span>
                    <p className="text-blue-600 text-sm">Download the scan form for carrier pickup</p>
                  </div>
                </div>
                <Button 
                  onClick={handleDownloadManifest} 
                  variant="outline" 
                  className="border-blue-300 text-blue-600 hover:bg-blue-100 h-12 px-6 font-semibold rounded-lg" 
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Manifest
                </Button>
              </div>
            </div>
          )}
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
            <Button 
              onClick={onCreateLabels} 
              disabled={isCreatingLabels} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg" 
              size="lg"
            >
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
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-3 last:mb-0 p-3 bg-white rounded-lg border-l-4 border-red-400 shadow-sm">
                <div className="font-semibold text-red-800">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}
                </div>
                <div className="text-red-600 text-sm mt-1">{failed.details || failed.error}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enhanced Batch Print Preview Modal */}
      {results.batchResult?.consolidatedLabelUrls?.pdf && (
        <EnhancedPrintPreview
          isOpenProp={showBatchPreview}
          onOpenChangeProp={setShowBatchPreview}
          labelUrl={results.batchResult.consolidatedLabelUrls.pdf}
          trackingCode={`Batch-${results.batchResult.batchId}`}
          shipmentId={results.batchResult.batchId}
        />
      )}

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

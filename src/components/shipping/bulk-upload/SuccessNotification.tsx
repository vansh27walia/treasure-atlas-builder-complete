import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
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
  console.log('SuccessNotification received results:', results);

  // Safely get shipments array - handle both array and object formats
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
  
  // Count shipments with labels (successful ones)
  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasLabel = !!(
      (shipment.label_url && shipment.label_url.trim() !== '') ||
      (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') ||
      shipment.status === 'completed'
    );
    console.log('Shipment label check:', shipment.id, 'status:', shipment.status, 'hasLabel:', hasLabel, {
      label_url: shipment.label_url,
      label_urls_png: shipment.label_urls?.png
    });
    return hasLabel;
  });

  // Count failed shipments
  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');
  
  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    failedShipments: failedShipments.length,
    bulkPngUrl: results.bulk_label_png_url,
    bulkPdfUrl: results.bulk_label_pdf_url,
    resultsTotal: results.total,
    resultsSuccessful: results.successful
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;
  const hasBulkLabels = !!(results.bulk_label_png_url || results.bulk_label_pdf_url);

  // Show notification if we have shipments or results
  const shouldShowNotification = totalProcessed > 0 || results.total > 0 || results.successful > 0;

  console.log('SuccessNotification shouldShowNotification:', shouldShowNotification);

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
      // For files stored in shipping-labels bucket, download directly
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      link.setAttribute('crossorigin', 'anonymous');
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  const handleDownloadBulkPNG = async () => {
    if (results.bulk_label_png_url) {
      await downloadFile(results.bulk_label_png_url, `bulk_shipping_labels_${Date.now()}.png`);
    } else {
      // If no bulk URL, download all individual labels
      await handleDownloadAllIndividualLabels();
    }
  };

  const handleDownloadBulkPDF = async () => {
    if (results.bulk_label_pdf_url) {
      await downloadFile(results.bulk_label_pdf_url, `bulk_shipping_labels_${Date.now()}.pdf`);
    } else {
      toast.error('Bulk PDF not available');
    }
  };

  const handleDownloadAllIndividualLabels = async () => {
    console.log('Downloading all individual labels, count:', shipmentsWithLabels.length);
    
    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    toast.loading('Starting downloads...');
    
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      const labelUrl = shipment.label_urls?.png || shipment.label_url;
      if (labelUrl) {
        try {
          setTimeout(async () => {
            const trackingCode = shipment.tracking_number || shipment.tracking_code || shipment.trackingCode;
            await downloadFile(labelUrl, `label_${trackingCode || Date.now()}.png`);
          }, i * 500);
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    toast.success(`Started download of ${shipmentsWithLabels.length} labels`);
  };

  // Don't show if no data
  if (!shouldShowNotification) {
    console.log('No shipments or results to show, not showing success notification');
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasLabels || hasBulkLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
          </h3>
          <p className="text-green-700">
            {hasLabels || hasBulkLabels
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

      {/* Download Buttons Section - Always visible when labels exist */}
      {(hasLabels || hasBulkLabels) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-lg text-blue-800 mb-4">Download Your Labels</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bulk Downloads */}
            <div>
              <h5 className="font-medium text-blue-700 mb-2">Bulk Downloads</h5>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleDownloadBulkPNG}
                  className="bg-green-600 hover:bg-green-700 text-white w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All Labels (PNG)
                </Button>
                
                {results.bulk_label_pdf_url && (
                  <Button 
                    onClick={handleDownloadBulkPDF}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                  >
                    <File className="mr-2 h-4 w-4" />
                    Download All Labels (PDF)
                  </Button>
                )}
              </div>
            </div>

            {/* Individual Downloads */}
            {hasLabels && (
              <div>
                <h5 className="font-medium text-blue-700 mb-2">Individual Downloads</h5>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleDownloadAllIndividualLabels}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Individual Labels ({shipmentsWithLabels.length})
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => window.print()}
                    className="border-blue-200 hover:bg-blue-50 w-full"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Print Summary
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Labels Button - show if no labels exist yet but we have processed shipments */}
      {!hasLabels && !hasBulkLabels && displayTotal > 0 && (
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

      {/* ALWAYS show the SuccessfulShipmentsTable when we have processed shipments */}
      {allShipments.length > 0 && (
        <div className="mt-6">
          <SuccessfulShipmentsTable
            shipments={allShipments}
            onDownloadSingleLabel={onDownloadSingleLabel}
            onDownloadAllLabels={handleDownloadAllIndividualLabels}
          />
        </div>
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <div className="mt-6">
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
        </div>
      )}
    </Card>
  );
};

export default SuccessNotification;

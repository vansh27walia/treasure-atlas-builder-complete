
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
  onProceedToPayment: () => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onProceedToPayment,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  // Ensure we have processed shipments
  const allShipments = Array.isArray(results.processedShipments) ? results.processedShipments : [];
  console.log('SuccessNotification - All shipments:', allShipments.length);
  
  // Count shipments with labels (those that have label_url or label_urls.png)
  const shipmentsWithLabels = allShipments.filter(shipment => 
    (shipment.label_url && shipment.label_url.trim() !== '') ||
    (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '')
  );
  
  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    bulkPngUrl: results.bulk_label_png_url,
    bulkPdfUrl: results.bulk_label_pdf_url,
    sampleShipment: allShipments[0],
    resultsTotal: results.total,
    resultsSuccessful: results.successful
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;
  const hasBulkLabels = !!(results.bulk_label_png_url || results.bulk_label_pdf_url);

  // If we have results.total or results.successful but no processedShipments, show the notification anyway
  const shouldShowNotification = totalProcessed > 0 || results.total > 0 || results.successful > 0;

  console.log('SuccessNotification shouldShowNotification:', shouldShowNotification);

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
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

  const handleDownloadBulkPNG = async () => {
    if (results.bulk_label_png_url) {
      await downloadFile(results.bulk_label_png_url, `bulk_shipping_labels_${Date.now()}.png`);
    } else {
      toast.error('Bulk PNG not available');
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

  // If no shipments processed and no results to show, don't show the success notification
  if (!shouldShowNotification) {
    console.log('No shipments or results to show, not showing success notification');
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasLabels || hasBulkLabels ? 'Labels Generated Successfully!' : 'Shipments Processed Successfully!'}
          </h3>
          <p className="text-green-700">
            {hasLabels || hasBulkLabels
              ? `${displaySuccessful} shipping labels have been created and are ready for download.`
              : `${displayTotal} shipments have been processed and are ready for label creation.`
            }
          </p>
        </div>
      </div>

      {results.failed > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {results.failed} shipments failed to process. Please check the error details below.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{displayTotal}</div>
          <div className="text-sm text-gray-600">Total Processed</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{displaySuccessful}</div>
          <div className="text-sm text-gray-600">Labels Generated</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
      </div>

      {/* Bulk Download Section - only show if we have bulk labels */}
      {hasBulkLabels && (
        <div className="mb-6">
          <h4 className="font-semibold text-lg text-green-800 mb-3">Download All Labels (Bulk)</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            {results.bulk_label_png_url && (
              <Button 
                onClick={handleDownloadBulkPNG}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Labels (PNG)
              </Button>
            )}
            
            {results.bulk_label_pdf_url && (
              <Button 
                onClick={handleDownloadBulkPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <File className="mr-2 h-4 w-4" />
                Download All Labels (PDF)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Individual Downloads Section - show if we have individual labels */}
      {hasLabels && (
        <div className="mb-6">
          <h4 className="font-semibold text-lg text-green-800 mb-3">Individual Label Downloads</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleDownloadAllIndividualLabels}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download All Individual Labels ({shipmentsWithLabels.length})
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.print()}
              className="border-green-200 hover:bg-green-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              Print Summary
            </Button>
          </div>
        </div>
      )}

      {/* Create Labels Button - show if no labels exist yet but we have processed shipments */}
      {!hasLabels && !hasBulkLabels && displayTotal > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-lg text-green-800 mb-3">Create Shipping Labels</h4>
          <Button 
            onClick={onCreateLabels}
            disabled={isCreatingLabels}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCreatingLabels ? 'Creating Labels...' : 'Create Labels Now'}
          </Button>
        </div>
      )}

      {/* Always show the SuccessfulShipmentsTable when we have processed shipments */}
      {allShipments.length > 0 && (
        <SuccessfulShipmentsTable
          shipments={allShipments}
          onDownloadSingleLabel={onDownloadSingleLabel}
          onDownloadAllLabels={handleDownloadAllIndividualLabels}
        />
      )}

      {/* Failed Shipments */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="font-medium text-red-700">Row {failed.row}:</span>
                <span className="text-red-600 ml-2">{failed.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SuccessNotification;

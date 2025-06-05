
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
  // Count successful shipments (those with labels or tracking codes)
  const successfulShipments = results.processedShipments?.filter(shipment => 
    shipment.label_url || shipment.tracking_code || shipment.trackingCode
  ) || [];
  
  const hasLabels = successfulShipments.length > 0;
  const totalProcessed = results.processedShipments?.length || 0;

  console.log('SuccessNotification Debug:', {
    totalProcessed,
    successfulShipments: successfulShipments.length,
    hasLabels,
    sampleShipment: results.processedShipments?.[0],
    allShipments: results.processedShipments
  });

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

  const handleDownloadAllPDF = async () => {
    if (results.bulk_label_pdf_url) {
      await downloadFile(results.bulk_label_pdf_url, `bulk_shipping_labels_${Date.now()}.pdf`);
    } else {
      toast.error('Bulk PDF not available');
    }
  };

  const handleDownloadAllIndividualLabels = async () => {
    console.log('Downloading all individual labels, count:', successfulShipments.length);
    
    if (successfulShipments.length === 0) {
      toast.error('No labels available for download');
      return;
    }

    toast.loading('Starting downloads...');
    
    for (let i = 0; i < successfulShipments.length; i++) {
      const shipment = successfulShipments[i];
      if (shipment.label_url) {
        try {
          setTimeout(async () => {
            await downloadFile(shipment.label_url!, `label_${shipment.tracking_code || shipment.trackingCode || Date.now()}.pdf`);
          }, i * 500);
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    toast.success(`Started download of ${successfulShipments.length} labels`);
  };

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            {hasLabels ? 'Labels Generated Successfully!' : 'Shipments Processed Successfully!'}
          </h3>
          <p className="text-green-700">
            {hasLabels 
              ? `${successfulShipments.length} shipping labels have been created and are ready for download.`
              : `${totalProcessed} shipments have been processed.`
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
          <div className="text-2xl font-bold text-green-600">{successfulShipments.length}</div>
          <div className="text-sm text-gray-600">Labels Generated</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{totalProcessed}</div>
          <div className="text-sm text-gray-600">Total Processed</div>
        </div>
      </div>

      {/* Action Buttons - show if we have labels */}
      {hasLabels && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Button 
            onClick={handleDownloadAllIndividualLabels}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Labels
          </Button>
          
          {results.bulk_label_pdf_url && (
            <Button 
              onClick={handleDownloadAllPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <File className="mr-2 h-4 w-4" />
              Download Bulk PDF
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="border-green-200 hover:bg-green-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            Print Summary
          </Button>
        </div>
      )}

      {/* Always show the SuccessfulShipmentsTable when we have processed shipments */}
      {totalProcessed > 0 && results.processedShipments && (
        <SuccessfulShipmentsTable
          shipments={results.processedShipments}
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

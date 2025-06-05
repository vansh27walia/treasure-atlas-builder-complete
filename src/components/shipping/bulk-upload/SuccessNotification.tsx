
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, File, Eye, Printer } from 'lucide-react';
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
  const successfulShipments = results.processedShipments?.filter(shipment => shipment.label_url) || [];
  const hasLabels = successfulShipments.length > 0;

  const downloadFile = async (url: string, filename: string) => {
    try {
      console.log('Downloading file from URL:', url);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      // Append to body, click, and remove
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

  const handleDownloadIndividualLabel = async (labelUrl: string, format: string = 'png') => {
    const filename = `shipping_label_${Date.now()}.${format}`;
    await downloadFile(labelUrl, filename);
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
          // Stagger downloads to avoid overwhelming the browser
          setTimeout(async () => {
            await handleDownloadIndividualLabel(shipment.label_url!, 'pdf');
          }, i * 500);
        } catch (error) {
          console.error('Error downloading label for shipment:', shipment.id, error);
        }
      }
    }
    
    toast.dismiss();
    toast.success(`Started download of ${successfulShipments.length} labels`);
  };

  const handlePrintLabel = (labelUrl: string) => {
    window.open(labelUrl, '_blank');
  };

  return (
    <Card className="mt-6 p-6 border-green-200 bg-green-50">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
        <div>
          <h3 className="text-lg font-semibold text-green-800">
            Labels Generated Successfully!
          </h3>
          <p className="text-green-700">
            {successfulShipments.length} shipping labels have been created and are ready for download.
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
          <div className="text-sm text-gray-600">Successful Labels</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600">Total Shipping Cost</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{results.total || results.processedShipments?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Shipments</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button 
          onClick={handleDownloadAllIndividualLabels}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={!hasLabels}
        >
          <Download className="mr-2 h-4 w-4" />
          Download All Individual Labels (PDF)
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

      {/* Individual Labels Section with detailed tracking and download options */}
      {hasLabels && (
        <div className="bg-white p-6 rounded-lg border border-green-200 mb-6">
          <h4 className="font-medium text-green-800 mb-4 text-lg">Individual Shipping Labels</h4>
          <div className="space-y-4">
            {successfulShipments.map((shipment) => (
              <div key={shipment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Tracking Information */}
                  <div className="lg:col-span-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">Tracking Number</div>
                    <div className="font-mono text-sm bg-gray-100 p-2 rounded border">
                      {shipment.tracking_code || shipment.trackingCode || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {shipment.carrier} - {shipment.service}
                    </div>
                  </div>

                  {/* Recipient Information */}
                  <div className="lg:col-span-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">Ship To</div>
                    <div className="text-sm">
                      <div className="font-medium">{shipment.customer_name || shipment.details?.to_name || shipment.recipient}</div>
                      {(shipment.customer_company || shipment.details?.to_company) && (
                        <div className="text-gray-600">{shipment.customer_company || shipment.details?.to_company}</div>
                      )}
                      <div className="text-gray-600 text-xs mt-1">
                        {shipment.details?.to_street1 || shipment.customer_address}<br/>
                        {shipment.details?.to_city}, {shipment.details?.to_state} {shipment.details?.to_zip}
                      </div>
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="lg:col-span-1">
                    <div className="text-sm font-medium text-gray-700 mb-1">Package Details</div>
                    <div className="text-sm text-gray-600">
                      {shipment.details?.length && shipment.details?.width && shipment.details?.height ? (
                        <div>
                          <div>Dimensions: {shipment.details.length}" × {shipment.details.width}" × {shipment.details.height}"</div>
                          <div>Weight: {shipment.details.weight} lbs</div>
                        </div>
                      ) : (
                        <div>Weight: {shipment.details?.weight || 0} lbs</div>
                      )}
                      <div className="text-xs mt-1">Rate: ${shipment.rate?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1 flex flex-col gap-2">
                    <div className="text-sm font-medium text-gray-700 mb-1">Actions</div>
                    <div className="flex flex-col gap-2">
                      {/* Preview Button */}
                      {shipment.label_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePrintLabel(shipment.label_url!)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview Label
                        </Button>
                      )}
                      
                      {/* Download PDF Button */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownloadIndividualLabel(shipment.label_url!, 'pdf')}
                        disabled={!shipment.label_url}
                        className="text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download PDF
                      </Button>

                      {/* Print Button */}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePrintLabel(shipment.label_url!)}
                        disabled={!shipment.label_url}
                        className="text-xs"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        Print Label
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular SuccessfulShipmentsTable for additional functionality */}
      {hasLabels && (
        <SuccessfulShipmentsTable
          shipments={successfulShipments}
          onDownloadSingleLabel={handleDownloadIndividualLabel}
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

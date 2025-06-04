
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, Printer, File } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import PrintPreview from '../PrintPreview';

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

  const handleDownloadAllPDF = () => {
    if (results.bulk_label_pdf_url) {
      onDownloadSingleLabel(results.bulk_label_pdf_url, 'pdf');
    }
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
          onClick={onDownloadAllLabels}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={!hasLabels}
        >
          <Download className="mr-2 h-4 w-4" />
          Download All Labels (PNG)
        </Button>
        
        {results.bulk_label_pdf_url && (
          <Button 
            onClick={handleDownloadAllPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <File className="mr-2 h-4 w-4" />
            Download All Labels (PDF)
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

      {/* Enhanced Successful Shipments Table with Individual Actions */}
      {hasLabels && (
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-4">Individual Label Actions</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tracking #</th>
                  <th className="text-left p-2">Recipient</th>
                  <th className="text-left p-2">Address</th>
                  <th className="text-left p-2">Dimensions</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {successfulShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">
                      {shipment.tracking_code || shipment.trackingCode}
                    </td>
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                        <div className="text-xs text-gray-500">{shipment.carrier} - {shipment.service}</div>
                      </div>
                    </td>
                    <td className="p-2 text-xs">
                      <div>
                        {shipment.details?.to_name || shipment.details?.name}<br/>
                        {shipment.details?.to_street1 || shipment.details?.street1}<br/>
                        {shipment.details?.to_city || shipment.details?.city}, {shipment.details?.to_state || shipment.details?.state} {shipment.details?.to_zip || shipment.details?.zip}
                      </div>
                    </td>
                    <td className="p-2 text-xs">
                      {shipment.details?.length && shipment.details?.width && shipment.details?.height ? (
                        <div>
                          {shipment.details.length}" × {shipment.details.width}" × {shipment.details.height}"<br/>
                          Weight: {shipment.details.weight} lbs
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {/* Print Preview Button */}
                        {shipment.label_url && (
                          <PrintPreview
                            labelUrl={shipment.label_url}
                            trackingCode={shipment.tracking_code || shipment.trackingCode}
                            shipmentDetails={{
                              fromAddress: results.pickupAddress ? 
                                `${results.pickupAddress.name}\n${results.pickupAddress.street1}\n${results.pickupAddress.city}, ${results.pickupAddress.state} ${results.pickupAddress.zip}` : 
                                'Pickup Address',
                              toAddress: `${shipment.details?.to_name || shipment.details?.name}\n${shipment.details?.to_street1 || shipment.details?.street1}\n${shipment.details?.to_city || shipment.details?.city}, ${shipment.details?.to_state || shipment.details?.state} ${shipment.details?.to_zip || shipment.details?.zip}`,
                              weight: `${shipment.details?.weight || 0} lbs`,
                              dimensions: shipment.details?.length && shipment.details?.width && shipment.details?.height ? 
                                `${shipment.details.length}" × ${shipment.details.width}" × ${shipment.details.height}"` : 
                                undefined,
                              service: shipment.service,
                              carrier: shipment.carrier
                            }}
                          />
                        )}
                        
                        {/* Download PNG Button */}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onDownloadSingleLabel(shipment.label_url!, 'png')}
                          disabled={!shipment.label_url}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PNG
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regular SuccessfulShipmentsTable for additional functionality */}
      {hasLabels && (
        <SuccessfulShipmentsTable
          shipments={successfulShipments}
          onDownloadSingleLabel={onDownloadSingleLabel}
          onDownloadAllLabels={onDownloadAllLabels}
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

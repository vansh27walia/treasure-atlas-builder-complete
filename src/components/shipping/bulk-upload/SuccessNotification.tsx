
import React from 'react';
import { BulkUploadResult } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Download, ArrowRight, Mail } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (shipmentId: string, trackingCode: string) => void;
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
  isCreatingLabels,
}) => {
  const successCount = results.processedShipments.filter(s => s.status === 'completed').length;
  const pendingCount = results.processedShipments.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <Alert variant="default" className="bg-green-50 border-green-200">
        <AlertCircle className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-700">Processing Complete</AlertTitle>
        <AlertDescription className="text-green-700">
          {pendingCount > 0 
            ? `We've processed your shipments. Please proceed to complete your payment or create labels now.`
            : `All ${successCount} shipments have been processed successfully.`
          }
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Shipment Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">Total Shipments</p>
            <p className="text-2xl font-semibold">{results.total}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">Processed</p>
            <p className="text-2xl font-semibold">{successCount}</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-700">Pending</p>
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-700">Total Cost</p>
            <p className="text-2xl font-semibold">${results.totalCost.toFixed(2)}</p>
          </div>
        </div>
        
        {pendingCount > 0 && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <Button
                onClick={onCreateLabels}
                disabled={isCreatingLabels || results.processedShipments.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreatingLabels ? 'Creating Labels...' : 'Create All Labels'} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                onClick={onProceedToPayment}
                disabled={isPaying || results.processedShipments.length === 0}
                variant="outline"
              >
                {isPaying ? 'Processing...' : 'Proceed to Payment'} 
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {successCount > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Label Downloads</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <Button
                onClick={onDownloadAllLabels}
                variant={pendingCount > 0 ? "outline" : "default"}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Download All Labels
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center"
                onClick={() => {
                  const emailEvent = new CustomEvent('email-bulk-labels', {
                    detail: { shipments: results.processedShipments }
                  });
                  document.dispatchEvent(emailEvent);
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email All Labels
              </Button>
            </div>
          </div>
        )}
        
        {successCount > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-3">Processed Shipments</h3>
            <div className="overflow-auto max-h-96">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-4 text-left border-b text-sm font-medium text-gray-500">Tracking #</th>
                    <th className="py-2 px-4 text-left border-b text-sm font-medium text-gray-500">To</th>
                    <th className="py-2 px-4 text-left border-b text-sm font-medium text-gray-500">Carrier</th>
                    <th className="py-2 px-4 text-left border-b text-sm font-medium text-gray-500">Service</th>
                    <th className="py-2 px-4 text-right border-b text-sm font-medium text-gray-500">Cost</th>
                    <th className="py-2 px-4 text-right border-b text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.processedShipments
                    .filter(shipment => shipment.status === 'completed' && shipment.tracking_code)
                    .map((shipment, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4 text-sm font-mono">{shipment.tracking_code}</td>
                        <td className="py-2 px-4 text-sm">
                          {shipment.details?.city}, {shipment.details?.state} {shipment.details?.zip}
                        </td>
                        <td className="py-2 px-4 text-sm">{shipment.carrier.toUpperCase()}</td>
                        <td className="py-2 px-4 text-sm">{shipment.service}</td>
                        <td className="py-2 px-4 text-right text-sm">${parseFloat(shipment.rate.toString()).toFixed(2)}</td>
                        <td className="py-2 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            className="text-blue-600 hover:text-blue-800" 
                            size="sm"
                            onClick={() => shipment.id && shipment.tracking_code && 
                              onDownloadSingleLabel(shipment.id, shipment.tracking_code)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SuccessNotification;

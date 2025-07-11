
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Mail, Package, Truck, FileText, AlertTriangle } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

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
  const successfulShipments = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedShipments = results.processedShipments?.filter(s => s.status === 'failed') || [];

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 shadow-lg">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Labels Created Successfully!
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your shipping labels have been generated and are ready for download.
        </p>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-700 mb-2">
              {successfulShipments.length}
            </div>
            <div className="text-green-600 font-medium">Labels Created</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-2">
              ${results.totalCost?.toFixed(2) || '0.00'}
            </div>
            <div className="text-blue-600 font-medium">Total Cost</div>
          </CardContent>
        </Card>

        {failedShipments.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-700 mb-2">
                {failedShipments.length}
              </div>
              <div className="text-red-600 font-medium">Failed</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Download Options - No Payment Here */}
      {successfulShipments.length > 0 && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Download className="w-6 h-6 mr-3 text-green-600" />
              Download Your Labels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bulk Downloads */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-800">Bulk Downloads</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={onDownloadAllLabels}
                  className="bg-green-600 hover:bg-green-700 shadow-lg"
                  size="lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download All Labels (PNG)
                </Button>
                
                {results.bulk_label_pdf_url && (
                  <Button
                    onClick={() => onDownloadSingleLabel(results.bulk_label_pdf_url!, 'pdf')}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                    size="lg"
                  >
                    <FileText className="mr-2 h-5 w-5" />
                    Download Bulk PDF
                  </Button>
                )}
              </div>
            </div>

            {/* Individual Downloads */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-gray-800">Individual Labels</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {successfulShipments.map((shipment, index) => (
                  <div key={shipment.id || index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {shipment.recipient || shipment.customer_name || `Shipment ${index + 1}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.carrier} - {shipment.service} - ${shipment.rate?.toFixed(2)}
                      </div>
                      {shipment.tracking_code && (
                        <div className="text-sm text-blue-600 font-mono">
                          Tracking: {shipment.tracking_code}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => onDownloadSingleLabel(shipment.label_url!, 'png')}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Shipments */}
      {failedShipments.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Failed Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedShipments.map((shipment, index) => (
                <div key={shipment.id || index} className="p-4 bg-white rounded-lg border border-red-200">
                  <div className="font-medium text-gray-900 mb-2">
                    {shipment.recipient || shipment.customer_name || `Shipment ${index + 1}`}
                  </div>
                  <div className="text-sm text-red-600">
                    Error: {shipment.error || 'Unknown error occurred'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuccessNotification;

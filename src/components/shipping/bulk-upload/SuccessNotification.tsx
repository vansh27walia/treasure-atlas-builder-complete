
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, FileText, Package, Printer } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string) => void;
  onCreateLabels?: () => void;
  isPaying?: boolean;
  isCreatingLabels?: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  isCreatingLabels = false
}) => {
  const successfulLabels = results.processedShipments?.filter(s => s.label_url) || [];
  const hasLabels = successfulLabels.length > 0;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-green-800 text-xl">
                Labels Successfully Created!
              </CardTitle>
              <p className="text-green-700 mt-1">
                {results.successful} shipping labels have been generated and are ready for download.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Download Options */}
      {hasLabels && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Download Your Labels</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bulk Download Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={onDownloadAllLabels}
                className="flex items-center justify-center space-x-2 h-12"
                variant="default"
              >
                <FileText className="h-4 w-4" />
                <span>Download All (PNG)</span>
              </Button>
              
              {results.bulk_label_pdf_url && (
                <Button
                  onClick={() => onDownloadSingleLabel(results.bulk_label_pdf_url!)}
                  className="flex items-center justify-center space-x-2 h-12"
                  variant="outline"
                >
                  <FileText className="h-4 w-4" />
                  <span>Download PDF Batch</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                className="flex items-center justify-center space-x-2 h-12"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                <span>Print All Labels</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Labels Table */}
      {hasLabels && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Individual Labels ({successfulLabels.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Recipient</th>
                    <th className="text-left py-3 px-4 font-medium">Tracking Number</th>
                    <th className="text-left py-3 px-4 font-medium">Carrier</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {successfulLabels.map((shipment, index) => (
                    <tr key={shipment.id || index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                          <div className="text-sm text-gray-500">
                            {typeof shipment.customer_address === 'string' 
                              ? shipment.customer_address 
                              : shipment.customer_address?.street1 || ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {shipment.tracking_code || shipment.tracking_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{shipment.carrier}</div>
                          <div className="text-sm text-gray-500">{shipment.service}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {shipment.label_url && (
                          <Button
                            onClick={() => onDownloadSingleLabel(shipment.label_url!)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Download className="mr-1 h-4 w-4" />
                            Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{results.successful}</div>
            <div className="text-sm text-gray-600">Labels Created</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              ${results.totalCost?.toFixed(2) || '0.00'}
            </div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{results.total}</div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuccessNotification;

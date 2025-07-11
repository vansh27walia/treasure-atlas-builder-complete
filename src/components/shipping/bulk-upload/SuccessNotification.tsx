
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Package, Mail } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (url: string) => void;
  onCreateLabels: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
}) => {
  const handleDownloadPDF = () => {
    if (results.bulk_label_pdf_url) {
      onDownloadSingleLabel(results.bulk_label_pdf_url);
    }
  };

  const handleDownloadIndividual = () => {
    onDownloadAllLabels();
  };

  const handleEmailLabels = () => {
    // Email functionality placeholder
    console.log('Email labels functionality to be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Download Options */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="text-center mb-6">
          <Package className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-900 mb-2">Labels Ready for Download!</h3>
          <p className="text-green-700">
            Choose your preferred download format below
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bulk PDF Download */}
          {results.bulk_label_pdf_url && (
            <Button
              onClick={handleDownloadPDF}
              className="h-20 bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center space-y-2"
            >
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Download All (PDF)</div>
                <div className="text-xs opacity-90">Single PDF file</div>
              </div>
            </Button>
          )}

          {/* Individual Labels */}
          <Button
            onClick={handleDownloadIndividual}
            className="h-20 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center space-y-2"
          >
            <Download className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Individual Labels</div>
              <div className="text-xs opacity-90">Separate files</div>
            </div>
          </Button>

          {/* Email Labels */}
          <Button
            onClick={handleEmailLabels}
            variant="outline"
            className="h-20 border-2 border-blue-200 hover:bg-blue-50 flex flex-col items-center justify-center space-y-2"
          >
            <Mail className="h-6 w-6 text-blue-600" />
            <div className="text-center">
              <div className="font-semibold text-blue-600">Email Labels</div>
              <div className="text-xs text-blue-500">Send via email</div>
            </div>
          </Button>
        </div>
      </Card>

      {/* Summary Information */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-900">Shipment Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{results.successful || 0}</div>
            <div className="text-sm text-blue-800">Labels Created</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-green-800">Total Cost</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{results.processedShipments?.length || 0}</div>
            <div className="text-sm text-purple-800">Total Shipments</div>
          </div>
        </div>
      </Card>

      {/* Individual Labels List */}
      {results.processedShipments && results.processedShipments.length > 0 && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4 text-gray-900">Individual Labels</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {results.processedShipments.map((shipment, index) => (
              <div key={shipment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {shipment.recipient || shipment.customer_name || `Shipment ${index + 1}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {shipment.carrier} - {shipment.service} | ${shipment.rate?.toFixed(2) || '0.00'}
                  </div>
                  {shipment.tracking_code && (
                    <div className="text-xs text-gray-500 font-mono">
                      Tracking: {shipment.tracking_code}
                    </div>
                  )}
                </div>
                {shipment.label_url && (
                  <Button
                    onClick={() => onDownloadSingleLabel(shipment.label_url!)}
                    size="sm"
                    variant="outline"
                    className="ml-4"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SuccessNotification;

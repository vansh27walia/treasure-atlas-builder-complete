
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Package, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import ConsolidatedBatchActions from './ConsolidatedBatchActions';
import IndividualLabelActions from './IndividualLabelActions';
import BatchLabelActionsManager from './BatchLabelActionsManager';

interface BatchLabelCreationPageProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string) => void;
  batchPrintPreviewModalOpen: boolean;
  setBatchPrintPreviewModalOpen: (open: boolean) => void;
}

const BatchLabelCreationPage: React.FC<BatchLabelCreationPageProps> = ({
  results,
  onDownloadSingleLabel,
  batchPrintPreviewModalOpen,
  setBatchPrintPreviewModalOpen
}) => {
  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  // Get street address safely
  const getStreetAddress = (shipment: any) => {
    if (typeof shipment.customer_address === 'string') {
      return shipment.customer_address;
    }
    if (shipment.customer_address && typeof shipment.customer_address === 'object') {
      return (shipment.customer_address as any).street1 || '';
    }
    return '';
  };

  const handleConsolidatedDownload = (format: string) => {
    const batchId = results.batchResult?.batchId;
    if (!batchId) {
      console.error('No batch ID available');
      return;
    }
    
    // Generate consolidated label URL from Supabase storage
    const baseUrl = 'https://adhegezdzqlnqqnymvps.supabase.co/storage/v1/object/public/batch_labels';
    const consolidatedUrl = `${baseUrl}/batch_label_${batchId}.${format}`;
    onDownloadSingleLabel(consolidatedUrl);
  };

  const handleEmailAll = (emails: string[]) => {
    console.log('Send consolidated files to emails:', emails);
    // Implementation will be handled by BatchLabelActionsManager
  };

  const handleIndividualDownload = (labelUrl: string, format: string) => {
    onDownloadSingleLabel(labelUrl);
  };

  const handleIndividualEmail = (email: string, shipmentId: string) => {
    console.log('Send individual label to email:', email, shipmentId);
    // Implementation will be handled by BatchLabelActionsManager
  };

  return (
    <BatchLabelActionsManager>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Batch Labels Created Successfully</h1>
            </div>
            <p className="text-gray-600">Your shipping labels have been generated and are ready for download and printing.</p>
          </div>

          {/* Consolidated Batch Actions */}
          {successfulLabels.length > 0 && (
            <ConsolidatedBatchActions
              results={results}
              onDownloadConsolidated={handleConsolidatedDownload}
              onEmailAll={handleEmailAll}
            />
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-green-600">{successfulLabels.length}</h3>
              <p className="text-gray-600">Labels Created</p>
            </Card>
            
            <Card className="p-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-red-600">{failedLabels.length}</h3>
              <p className="text-gray-600">Failed Labels</p>
            </Card>
            
            <Card className="p-6 text-center">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-blue-600">${results.totalCost?.toFixed(2) || '0.00'}</h3>
              <p className="text-gray-600">Total Cost</p>
            </Card>
          </div>

          {/* Individual Labels Table */}
          {successfulLabels.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Individual Labels</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4">Recipient</th>
                      <th className="text-left py-3 px-4">Tracking Number</th>
                      <th className="text-left py-3 px-4">Carrier</th>
                      <th className="text-left py-3 px-4">Cost</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {successfulLabels.map((shipment, index) => (
                      <tr key={shipment.id || index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{shipment.customer_name || shipment.recipient}</div>
                            <div className="text-sm text-gray-500">
                              {getStreetAddress(shipment)}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {shipment.tracking_code || shipment.tracking_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{shipment.carrier}</div>
                            <div className="text-sm text-gray-500">{shipment.service}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">${shipment.rate?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <IndividualLabelActions
                            shipment={shipment}
                            onDownload={handleIndividualDownload}
                            onEmail={handleIndividualEmail}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Failed Labels */}
          {failedLabels.length > 0 && (
            <Card className="p-6 mt-8 border-red-200">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Failed Labels</h2>
              <div className="space-y-3">
                {failedLabels.map((shipment, index) => (
                  <div key={shipment.id || index} className="p-3 bg-red-50 border border-red-200 rounded">
                    <div className="font-medium text-red-800">
                      {shipment.customer_name || shipment.recipient}
                    </div>
                    <div className="text-sm text-red-600 mt-1">
                      Error: {shipment.error || 'Unknown error occurred'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Print Preview Modal */}
        {results.batchResult && (
          <PrintPreview
            isOpenProp={batchPrintPreviewModalOpen}
            onOpenChangeProp={setBatchPrintPreviewModalOpen}
            labelUrl=""
            trackingCode={null}
            batchResult={results.batchResult}
            isBatchPreview={true}
          />
        )}
      </div>
    </BatchLabelActionsManager>
  );
};

export default BatchLabelCreationPage;


import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Package, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import PrintPreview from '@/components/shipping/PrintPreview';
import ConsolidatedLabelActions from '../ConsolidatedLabelActions';
import EnhancedLabelCreationView from '../EnhancedLabelCreationView';

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
  const handleBatchPrintPreview = () => {
    setBatchPrintPreviewModalOpen(true);
  };

  const handleEmailAll = async () => {
    // TODO: Implement batch email functionality
    console.log('Email all labels');
  };

  // Generate consolidated label URLs from batch result
  const consolidatedUrls = {
    pdf: results.batchResult?.consolidatedLabelUrls?.pdf,
    png: results.batchResult?.consolidatedLabelUrls?.png,
    zpl: results.batchResult?.consolidatedLabelUrls?.zpl,
    epl: results.batchResult?.consolidatedLabelUrls?.epl
  };

  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  // Transform data for EnhancedLabelCreationView
  const transformedLabels = successfulLabels.map(shipment => ({
    id: shipment.id || '',
    tracking_code: shipment.tracking_code || shipment.tracking_number || '',
    carrier: shipment.carrier || '',
    service: shipment.service || '',
    label_url: shipment.label_url || '',
    customer_name: shipment.customer_name || shipment.recipient || '',
    customer_address: typeof shipment.customer_address === 'string' 
      ? shipment.customer_address 
      : `${(shipment.customer_address as any)?.street1 || ''}, ${(shipment.customer_address as any)?.city || ''}`,
    customer_email: (shipment as any).customer_email,
    rate: shipment.rate || 0,
    status: 'success' as const
  }));

  return (
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

        {/* Consolidated Actions */}
        {successfulLabels.length > 0 && (
          <ConsolidatedLabelActions
            batchId={results.batchResult?.batchId || 'batch'}
            consolidatedUrls={consolidatedUrls}
            totalLabels={successfulLabels.length}
            onDownload={(format) => console.log(`Downloaded ${format} batch`)}
            onEmailAll={handleEmailAll}
          />
        )}

        {/* Enhanced Label Creation View */}
        <EnhancedLabelCreationView
          labels={transformedLabels}
          onDownloadLabel={(labelId) => {
            const label = successfulLabels.find(s => s.id === labelId);
            if (label?.label_url) {
              onDownloadSingleLabel(label.label_url);
            }
          }}
        />

        {/* Failed Labels */}
        {failedLabels.length > 0 && (
          <Card className="mt-8 border-red-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Failed Labels ({failedLabels.length})
              </h2>
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
            </div>
          </Card>
        )}
      </div>

      {/* Print Preview Modal */}
      {results.batchResult && consolidatedUrls.pdf && (
        <PrintPreview
          isOpenProp={batchPrintPreviewModalOpen}
          onOpenChangeProp={setBatchPrintPreviewModalOpen}
          labelUrl={consolidatedUrls.pdf}
          trackingCode={null}
          batchResult={results.batchResult}
          isBatchPreview={true}
        />
      )}
    </div>
  );
};

export default BatchLabelCreationPage;

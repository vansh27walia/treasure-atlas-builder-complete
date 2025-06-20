
import React from 'react';
import { BulkUploadResult } from '@/types/shipping';
import BatchLabelDisplay from './BatchLabelDisplay';
import { supabase } from '@/integrations/supa' + 'base/client';
import { toast } from '@/components/ui/sonner';

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
  // Store labels automatically when component mounts
  React.useEffect(() => {
    const storeLabelsAutomatically = async () => {
      if (!results?.processedShipments?.length) return;

      const successfulLabels = results.processedShipments.filter(
        s => s.status === 'completed' && s.label_url
      );

      if (successfulLabels.length === 0) return;

      try {
        // Store individual labels
        for (const shipment of successfulLabels) {
          if (shipment.label_urls) {
            await supabase.functions.invoke('store-label-files', {
              body: {
                shipmentId: shipment.id,
                labelUrls: shipment.label_urls,
                type: 'individual',
                trackingCode: shipment.tracking_code
              }
            });
          }
        }

        // Store batch labels if available
        if (results.batchResult?.consolidatedLabelUrls) {
          await supabase.functions.invoke('store-label-files', {
            body: {
              batchId: results.batchResult.batchId,
              labelUrls: results.batchResult.consolidatedLabelUrls,
              type: 'batch'
            }
          });
        }

        console.log('Labels stored successfully in backend');
      } catch (error) {
        console.error('Error storing labels:', error);
        toast.error('Failed to store labels in backend');
      }
    };

    storeLabelsAutomatically();
  }, [results]);

  if (!results || !results.processedShipments || results.processedShipments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Labels Available</h2>
          <p className="text-gray-600">No batch labels have been generated yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Batch Label Creation Results
          </h1>
          <p className="text-gray-600">
            Your shipping labels have been generated and are ready for download, printing, and sharing.
          </p>
        </div>

        <BatchLabelDisplay
          results={results}
          onDownloadSingleLabel={onDownloadSingleLabel}
        />
      </div>
    </div>
  );
};

export default BatchLabelCreationPage;

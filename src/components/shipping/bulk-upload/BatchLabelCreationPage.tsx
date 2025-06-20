
import React from 'react';
import { BulkUploadResult } from '@/types/shipping';
import BatchLabelDisplay from './BatchLabelDisplay';
import { supabase } from '@/integrations/supabase/client';
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
  console.log('BatchLabelCreationPage rendered with results:', results);

  // Store labels automatically when component mounts
  React.useEffect(() => {
    const storeLabelsAutomatically = async () => {
      if (!results?.processedShipments?.length) {
        console.log('No processed shipments found for storing labels');
        return;
      }

      const successfulLabels = results.processedShipments.filter(
        s => s.status === 'completed' && s.label_url
      );

      console.log('Successful labels to store:', successfulLabels.length);

      if (successfulLabels.length === 0) return;

      try {
        // Store individual labels
        for (const shipment of successfulLabels) {
          if (shipment.label_urls) {
            console.log('Storing individual label for shipment:', shipment.id);
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
          console.log('Storing batch labels for batch:', results.batchResult.batchId);
          await supabase.functions.invoke('store-label-files', {
            body: {
              batchId: results.batchResult.batchId,
              labelUrls: results.batchResult.consolidatedLabelUrls,
              type: 'batch'
            }
          });
        }

        console.log('Labels stored successfully in backend');
        toast.success('Labels saved to backend successfully');
      } catch (error) {
        console.error('Error storing labels:', error);
        toast.error('Failed to store labels in backend');
      }
    };

    storeLabelsAutomatically();
  }, [results]);

  // Debug: Log the current state
  console.log('Current results state:', {
    hasResults: !!results,
    hasProcessedShipments: !!results?.processedShipments,
    processedShipmentsLength: results?.processedShipments?.length || 0,
    uploadStatus: results?.uploadStatus,
    batchResult: results?.batchResult
  });

  if (!results) {
    console.log('No results provided to BatchLabelCreationPage');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Results Available</h2>
          <p className="text-gray-600">No batch results have been provided yet.</p>
        </div>
      </div>
    );
  }

  if (!results.processedShipments || results.processedShipments.length === 0) {
    console.log('No processed shipments found in results');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Labels Available</h2>
          <p className="text-gray-600">No batch labels have been generated yet.</p>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Debug: Results object exists but no processed shipments found.
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Results keys: {Object.keys(results).join(', ')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const successfulLabels = results.processedShipments.filter(s => s.status === 'completed' && s.label_url);
  const failedLabels = results.processedShipments.filter(s => s.status === 'failed');

  console.log('Rendering BatchLabelCreationPage with:', {
    totalShipments: results.processedShipments.length,
    successfulLabels: successfulLabels.length,
    failedLabels: failedLabels.length
  });

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
          <div className="mt-4 flex justify-center gap-4">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <span className="font-semibold">{successfulLabels.length}</span> Successful
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
              <span className="font-semibold">{failedLabels.length}</span> Failed
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <span className="font-semibold">{results.processedShipments.length}</span> Total
            </div>
          </div>
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

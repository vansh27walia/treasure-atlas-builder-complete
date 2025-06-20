
import React from 'react';
import { BulkUploadResult } from '@/types/shipping';
import BatchLabelActions from './BatchLabelActions';
import IndividualLabelCard from './IndividualLabelCard';

interface BatchLabelDisplayProps {
  results: BulkUploadResult;
  onDownloadSingleLabel: (labelUrl: string) => void;
  batchPrintPreviewModalOpen?: boolean;
  setBatchPrintPreviewModalOpen?: (open: boolean) => void;
}

const BatchLabelDisplay: React.FC<BatchLabelDisplayProps> = ({
  results,
  onDownloadSingleLabel
}) => {
  const successfulLabels = results.processedShipments?.filter(s => s.status === 'completed' && s.label_url) || [];
  const failedLabels = results.processedShipments?.filter(s => s.status === 'failed') || [];

  console.log('BatchLabelDisplay render:', {
    totalShipments: results.processedShipments?.length,
    successfulLabels: successfulLabels.length,
    failedLabels: failedLabels.length,
    hasBatchResult: !!results.batchResult
  });

  if (!results || !results.processedShipments || results.processedShipments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No labels to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Batch Actions - Like International Label Page */}
      <BatchLabelActions
        results={results}
        onDownloadSingleLabel={onDownloadSingleLabel}
      />

      {/* Individual Labels Section */}
      {successfulLabels.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Individual Labels ({successfulLabels.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {successfulLabels.map((shipment, index) => (
              <IndividualLabelCard
                key={shipment.id || index}
                shipment={shipment}
                onDownload={(format) => {
                  const url = shipment.label_urls?.[format] || shipment.label_url;
                  if (url) {
                    onDownloadSingleLabel(url);
                  }
                }}
                onPrintPreview={() => {
                  const pdfUrl = shipment.label_urls?.pdf;
                  if (pdfUrl) {
                    window.open(pdfUrl, '_blank');
                  }
                }}
                onEmail={(email, format) => {
                  console.log('Email individual label:', email, format, shipment.id);
                }}
                onCopyLink={(format) => {
                  const url = shipment.label_urls?.[format] || shipment.label_url;
                  if (url) {
                    navigator.clipboard.writeText(url);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Failed Labels Section */}
      {failedLabels.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-red-600">
            Failed Labels ({failedLabels.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {failedLabels.map((shipment, index) => (
              <IndividualLabelCard
                key={shipment.id || index}
                shipment={shipment}
                onDownload={() => {}}
                onPrintPreview={() => {}}
                onEmail={() => {}}
                onCopyLink={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchLabelDisplay;

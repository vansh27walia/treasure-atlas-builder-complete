
import React from 'react';
import { Check } from 'lucide-react';
import OrderSummary from './OrderSummary';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import FailedShipmentsTable from './FailedShipmentsTable';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: (format?: string) => void;
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
  // Check if any shipment is missing a label
  const missingLabels = results.processedShipments.some(s => !s.label_url);
  const hasLabels = results.processedShipments.some(s => s.label_url);
  const allShipmentsWithLabels = results.processedShipments.filter(s => s.label_url);

  // Handle bulk download with format options
  const handleBulkDownloadWithFormat = (format: string) => {
    if (format === 'zip') {
      // Use the bulk_label_png_url or bulk_label_pdf_url from results
      const bulkUrl = format === 'png' ? results.bulk_label_png_url : results.bulk_label_pdf_url;
      if (bulkUrl) {
        const link = document.createElement('a');
        link.href = bulkUrl;
        link.download = `bulk_shipping_labels.${format}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      onDownloadAllLabels(format);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-md mb-6">
      <div className="p-4">
        <div className="flex items-center mb-2">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-800">Upload Successful</h4>
        </div>
        <p className="text-green-700 mb-3">
          Successfully processed {results.successful} out of {results.total} shipments
          {results.failed > 0 && ` (${results.failed} failed)`}
          {missingLabels ? ". Click 'Create Labels' to generate shipping labels via EasyPost." : ` and generated ${allShipmentsWithLabels.length} labels.`}
        </p>
      
        <OrderSummary
          successfulCount={results.successful}
          totalCost={results.totalCost}
          onDownloadAllLabels={() => handleBulkDownloadWithFormat('pdf')}
          onProceedToPayment={onProceedToPayment}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
        
        {missingLabels && (
          <div className="mt-3">
            <button 
              onClick={onCreateLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition-colors"
              disabled={isCreatingLabels}
            >
              {isCreatingLabels ? "Creating Labels via EasyPost..." : "Create Labels"}
            </button>
          </div>
        )}
      </div>
      
      {hasLabels && (
        <SuccessfulShipmentsTable 
          shipments={allShipmentsWithLabels}
          onDownloadSingleLabel={onDownloadSingleLabel}
          onDownloadAllLabels={handleBulkDownloadWithFormat}
        />
      )}
      
      <FailedShipmentsTable 
        shipments={results.failedShipments} 
      />
    </div>
  );
};

export default SuccessNotification;


import React from 'react';
import { Check } from 'lucide-react';
import OrderSummary from './OrderSummary';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import FailedShipmentsTable from './FailedShipmentsTable';

interface ProcessingResult {
  total: number;
  successful: number;
  failed: number;
  totalCost: number;
  processedShipments: Array<{
    id: string;
    tracking_code: string;
    label_url: string;
    status: string;
    row: number;
    recipient: string;
    carrier: string;
  }>;
  failedShipments: Array<{
    row: number;
    error: string;
    details: string;
  }>;
}

interface SuccessNotificationProps {
  results: ProcessingResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string) => void;
  onProceedToPayment: () => void;
  isPaying: boolean;
  isCreatingLabels: boolean;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  results,
  onDownloadAllLabels,
  onDownloadSingleLabel,
  onProceedToPayment,
  isPaying,
  isCreatingLabels
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md mb-6">
      <div className="p-4">
        <div className="flex items-center mb-2">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-800">Upload Successful</h4>
        </div>
        <p className="text-green-700 mb-3">
          Successfully processed {results.successful} out of {results.total} shipments and generated labels.
          {results.failed > 0 && ` (${results.failed} failed)`}
        </p>
      
        <OrderSummary
          successfulCount={results.successful}
          totalCost={results.totalCost}
          onDownloadAllLabels={onDownloadAllLabels}
          onProceedToPayment={onProceedToPayment}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
      </div>
      
      <SuccessfulShipmentsTable 
        shipments={results.processedShipments}
        onDownloadSingleLabel={onDownloadSingleLabel} 
      />
      
      <FailedShipmentsTable 
        shipments={results.failedShipments} 
      />
    </div>
  );
};

export default SuccessNotification;

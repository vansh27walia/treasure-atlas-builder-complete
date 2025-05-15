
import React from 'react';
import { Check } from 'lucide-react';
import OrderSummary from './OrderSummary';
import SuccessfulShipmentsTable from './SuccessfulShipmentsTable';
import FailedShipmentsTable from './FailedShipmentsTable';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SuccessNotificationProps {
  results: BulkUploadResult;
  onDownloadAllLabels: () => void;
  onDownloadSingleLabel: (labelUrl: string) => void;
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
  const navigate = useNavigate();

  // Function to view individual label
  const handleViewLabel = (shipment: BulkShipment) => {
    if (shipment.label_url) {
      // Navigate to label success page with the label information
      const params = new URLSearchParams({
        labelUrl: shipment.label_url,
        trackingCode: shipment.tracking_code || '',
        shipmentId: shipment.id
      });
      
      navigate(`/label-success?${params.toString()}`);
    } else {
      // Fallback if no label URL
      onDownloadSingleLabel(shipment.label_url || '');
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
          {missingLabels ? ". Labels need to be generated." : " and generated labels."}
        </p>
      
        <OrderSummary
          successfulCount={results.successful}
          totalCost={results.totalCost}
          onDownloadAllLabels={onDownloadAllLabels}
          onProceedToPayment={onProceedToPayment}
          isPaying={isPaying}
          isCreatingLabels={isCreatingLabels}
        />
        
        {missingLabels && (
          <div className="mt-3">
            <button 
              onClick={onCreateLabels}
              className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
              disabled={isCreatingLabels}
            >
              {isCreatingLabels ? "Generating labels..." : "Generate All Labels"}
            </button>
          </div>
        )}
      </div>
      
      <SuccessfulShipmentsTable 
        shipments={results.processedShipments}
        onDownloadSingleLabel={onDownloadSingleLabel}
        onViewLabel={handleViewLabel}  
      />
      
      <FailedShipmentsTable 
        shipments={results.failedShipments} 
      />
    </div>
  );
};

export default SuccessNotification;

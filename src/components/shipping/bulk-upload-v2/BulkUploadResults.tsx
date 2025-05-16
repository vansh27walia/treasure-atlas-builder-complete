
import React, { useState } from 'react';
import SuccessfulShipmentsTable2 from './SuccessfulShipmentsTable2';
import FailedShipmentsTable2 from './FailedShipmentsTable2';
import OrderSummary2 from './OrderSummary2';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import { useShipmentRates2 } from '@/hooks/useShipmentRates2';
import { useShipmentLabels2 } from '@/hooks/useShipmentLabels2';

interface BulkUploadResultsProps {
  results: BulkUploadResult;
  setResults: (results: BulkUploadResult) => void;
  uploadStatus: 'idle' | 'success' | 'error' | 'editing';
  setUploadStatus: (status: 'idle' | 'success' | 'error' | 'editing') => void;
}

const BulkUploadResults: React.FC<BulkUploadResultsProps> = ({
  results,
  setResults,
  uploadStatus,
  setUploadStatus
}) => {
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  
  const { 
    isFetchingRates, 
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier
  } = useShipmentRates2(results, setResults);
  
  const {
    createLabels,
    downloadAllLabels,
    downloadSingleLabel,
    proceedToPayment
  } = useShipmentLabels2(results, setResults, setIsCreatingLabels, setIsPaying);

  // Count successful shipments (status is 'completed')
  const successfulCount = results.processedShipments.filter(
    shipment => shipment.status === 'completed'
  ).length;

  // Start over functionality
  const handleStartOver = () => {
    setUploadStatus('idle');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Upload Results - {results.successful} of {results.total} shipments processed
        </h3>
        <Button variant="ghost" size="sm" onClick={handleStartOver} className="flex items-center">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Start Over
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SuccessfulShipmentsTable2
            shipments={results.processedShipments.filter(s => s.status === 'completed')}
            onDownloadSingleLabel={downloadSingleLabel}
          />
          
          <FailedShipmentsTable2
            shipments={results.processedShipments.filter(s => s.status === 'error')}
            failedShipments={results.failedShipments}
          />
        </div>
        
        <div>
          <OrderSummary2
            successfulCount={successfulCount}
            totalCost={results.totalCost}
            onDownloadAllLabels={downloadAllLabels}
            onProceedToPayment={proceedToPayment}
            isPaying={isPaying}
            isCreatingLabels={isCreatingLabels}
          />
        </div>
      </div>
      
      {results.processedShipments.some(s => !s.label_url) && (
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => createLabels()} 
            disabled={isCreatingLabels}
            className="bg-green-600 hover:bg-green-700"
          >
            Generate All Labels
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkUploadResults;

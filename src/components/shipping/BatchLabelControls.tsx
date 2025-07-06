
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Mail, Printer } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';

interface BatchLabelControlsProps {
  selectedShipments: any[];
  pickupAddress?: any;
  onBatchProcessed?: (result: any) => void;
}

const BatchLabelControls: React.FC<BatchLabelControlsProps> = ({
  selectedShipments,
  pickupAddress,
  onBatchProcessed
}) => {
  const {
    isProcessingBatch,
    batchResult,
    processBatchLabels,
    downloadConsolidatedLabel,
    downloadScanForm
  } = useBatchLabelProcessing();

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleCreateBatchLabels = async () => {
    try {
      const result = await processBatchLabels(selectedShipments, pickupAddress);
      if (result && onBatchProcessed) {
        onBatchProcessed(result);
      }
    } catch (error) {
      console.error('Failed to process batch labels:', error);
    }
  };

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;

  return (
    <div className="flex items-center gap-2">
      {/* Payment for Batch Labels */}
      <PaymentMethodSelector
        selectedPaymentMethod={null}
        onPaymentMethodChange={() => {}}
        onPaymentComplete={(success) => {
          if (success) {
            handleCreateBatchLabels();
          }
        }}
        amount={selectedShipments.length * 5.99} // Calculate based on number of shipments
        description={`Batch Label Purchase (${selectedShipments.length} labels)`}
      />
      
      {/* Create Batch Labels Button */}
      <Button
        onClick={handleCreateBatchLabels}
        disabled={!hasSelectedShipments || isProcessingBatch}
        variant="outline"
        className="border-gray-300 hover:bg-gray-50"
      >
        <Printer className="mr-2 h-4 w-4" />
        {isProcessingBatch ? 'Processing...' : 'Create Batch Labels'}
      </Button>

      {/* Print Preview Modal */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={batchResult}
      />

      {/* Email Modal */}
      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={batchResult}
      />
    </div>
  );
};

export default BatchLabelControls;

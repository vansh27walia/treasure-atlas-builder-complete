
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Mail, Printer } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import BatchProgressTracker from './BatchProgressTracker';

interface BatchLabelControlsProps {
  selectedShipments: any[];
  pickupAddress?: any;
  onBatchProcessed?: (result: any) => void;
  currentStep?: 'upload' | 'mapping' | 'rates' | 'payment' | 'creation' | 'complete';
}

const BatchLabelControls: React.FC<BatchLabelControlsProps> = ({
  selectedShipments,
  pickupAddress,
  onBatchProcessed,
  currentStep = 'payment'
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
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

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

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      setPaymentCompleted(true);
      setShowPaymentSelector(false);
      handleCreateBatchLabels();
    }
  };

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method for batch:', paymentMethodId);
  };

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;
  const batchAmount = selectedShipments.length * 5.99; // Calculate based on number of shipments

  return (
    <div className="flex flex-col gap-4">
      {/* Progress Tracker */}
      <BatchProgressTracker 
        currentStep={paymentCompleted ? (hasBatchResult ? 'complete' : 'creation') : currentStep}
        isProcessing={isProcessingBatch}
      />

      {/* Payment Section - Show before batch processing */}
      {hasSelectedShipments && !paymentCompleted && !hasBatchResult && !showPaymentSelector && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">Ready to Create Batch Labels</h3>
          <p className="text-sm text-gray-600 mb-4">
            {selectedShipments.length} labels ready • Total: ${batchAmount.toFixed(2)}
          </p>
          <Button
            onClick={() => setShowPaymentSelector(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Proceed to Payment
          </Button>
        </div>
      )}

      {/* Payment Selector Modal */}
      {showPaymentSelector && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">Complete Payment to Create Batch Labels</h3>
          <PaymentMethodSelector
            selectedPaymentMethod={null}
            onPaymentMethodChange={handlePaymentMethodChange}
            onPaymentComplete={handlePaymentComplete}
            amount={batchAmount}
            description={`Batch Label Creation (${selectedShipments.length} labels)`}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentSelector(false)}
              className="mr-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Batch Processing Controls - Show after payment */}
      {paymentCompleted && !hasBatchResult && (
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateBatchLabels}
            disabled={!hasSelectedShipments || isProcessingBatch}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Printer className="mr-2 h-4 w-4" />
            {isProcessingBatch ? 'Processing...' : 'Create Batch Labels'}
          </Button>
        </div>
      )}

      {/* Download Options - Show after batch result */}
      {hasBatchResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-4">Batch Labels Ready!</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => downloadConsolidatedLabel('pdf')}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={() => setShowPrintPreview(true)}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Preview
            </Button>
            <Button
              onClick={() => setShowEmailModal(true)}
              variant="outline"
              className="border-green-300 hover:bg-green-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Labels
            </Button>
          </div>
        </div>
      )}

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


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Mail, Printer } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import BatchProgressTracker from './BatchProgressTracker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

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
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleCreateBatchLabels = async () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('No shipments selected for label creation');
      return;
    }

    setIsCreatingLabels(true);

    try {
      console.log('Creating batch labels with new function...');
      
      // Call the new create-bulk-labels function
      const { data, error } = await supabase.functions.invoke('create-bulk-labels', {
        body: {
          shipments: selectedShipments,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6'
          }
        }
      });

      if (error) {
        console.error('Error creating batch labels:', error);
        throw new Error(error.message || 'Failed to create batch labels');
      }

      if (data && data.success) {
        console.log('Batch labels created successfully:', data);
        toast.success(`Successfully created ${data.successful} labels out of ${data.total}`);
        
        if (onBatchProcessed) {
          onBatchProcessed(data);
        }

        setPaymentCompleted(true);

        // Update workflow step to complete
        document.dispatchEvent(new CustomEvent('shipping-step-change', { 
          detail: { step: 'complete' }
        }));
      } else {
        throw new Error('No data returned from batch label creation');
      }

    } catch (error) {
      console.error('Failed to create batch labels:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create batch labels');
    } finally {
      setIsCreatingLabels(false);
    }
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      console.log('Payment completed successfully, creating batch labels...');
      setPaymentCompleted(true);
      setShowPaymentSelector(false);
      
      // Automatically trigger label creation after payment
      setTimeout(() => {
        handleCreateBatchLabels();
      }, 1000);
    } else {
      toast.error('Payment failed. Please try again.');
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
        currentStep={
          isCreatingLabels ? 'creation' :
          paymentCompleted ? (hasBatchResult ? 'complete' : 'creation') : 
          currentStep
        }
        isProcessing={isProcessingBatch || isCreatingLabels}
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
      
      {/* Label Creation Status - Show during creation */}
      {isCreatingLabels && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Creating Labels...</h3>
          <p className="text-sm text-gray-600">
            Processing {selectedShipments.length} labels. This may take a few moments.
          </p>
          <div className="mt-2">
            <div className="animate-pulse bg-yellow-200 h-2 rounded"></div>
          </div>
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

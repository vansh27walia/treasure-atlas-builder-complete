
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Download, Mail, Printer, CreditCard, RefreshCw } from 'lucide-react';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const handleCreateBatchLabels = async () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('No shipments selected for label creation');
      return;
    }

    if (!paymentCompleted) {
      toast.error('Please complete payment first');
      setShowPaymentSelector(true);
      return;
    }

    setIsCreatingLabels(true);

    try {
      console.log('Creating batch labels with enhanced function...');
      
      // Call the enhanced create-bulk-labels function
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
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
      console.log('Payment completed successfully, ready to create batch labels...');
      setPaymentCompleted(true);
      setShowPaymentSelector(false);
      toast.success('Payment completed! You can now generate labels.');
    } else {
      toast.error('Payment failed. Please try again.');
    }
  };

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method for batch:', paymentMethodId);
    setSelectedPaymentMethod(paymentMethodId);
  };

  const handleRefreshRates = async () => {
    try {
      toast.success('Refreshing rates...');
      // Implement rate refresh logic here
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Rates refreshed successfully');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    }
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

      {/* Rate Refresh Section */}
      {hasSelectedShipments && !paymentCompleted && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Refresh Rates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Make sure you have the latest shipping rates before proceeding to payment.
          </p>
          <Button
            onClick={handleRefreshRates}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All Rates
          </Button>
        </div>
      )}

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
            <CreditCard className="mr-2 h-5 w-5" />
            Proceed to Payment
          </Button>
        </div>
      )}

      {/* Payment Selector Modal */}
      {showPaymentSelector && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">Complete Payment to Create Batch Labels</h3>
          <PaymentMethodSelector
            selectedPaymentMethod={selectedPaymentMethod}
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
      
      {/* Label Creation Section - Show after payment */}
      {paymentCompleted && !hasBatchResult && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-4">Payment Completed - Create Labels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your payment has been processed. You can now generate your shipping labels.
          </p>
          <Button
            onClick={handleCreateBatchLabels}
            disabled={isCreatingLabels}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isCreatingLabels ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Labels...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Generate Batch Labels
              </>
            )}
          </Button>
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

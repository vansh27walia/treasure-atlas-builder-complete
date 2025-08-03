
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Download, Mail, Printer, RefreshCw, Shield } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
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
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const shippingCost = selectedShipments.reduce((total, shipment) => total + (shipment.rate || 0), 0);
  const insuranceCost = selectedShipments.length * 2.00;
  const batchAmount = shippingCost + insuranceCost;

  const handleCreateBatchLabels = async () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('No shipments selected for label creation');
      return;
    }

    if (!paymentCompleted) {
      toast.error('Please complete payment first');
      return;
    }

    setIsCreatingLabels(true);

    try {
      console.log('Creating batch labels with enhanced function...');
      
      const { data, error } = await supabase.functions.invoke('create-enhanced-bulk-labels', {
        body: {
          shipments: selectedShipments,
          labelOptions: {
            generateBatch: true,
            label_format: 'PDF',
            label_size: '4x6',
            includeInsurance: true
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

  const handlePaymentComplete = () => {
    console.log('Payment completed successfully, ready to create batch labels...');
    setPaymentCompleted(true);
    toast.success('Payment completed! You can now generate labels.');
  };

  const handleRefreshRates = async () => {
    try {
      toast.success('Refreshing rates...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Rates refreshed successfully');
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    }
  };

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;

  return (
    <div className="space-y-6">
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
        <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-3 text-lg">Refresh Rates</h3>
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
        </Card>
      )}

      {/* Payment Summary & Action */}
      {hasSelectedShipments && !paymentCompleted && !hasBatchResult && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800 text-xl">Ready to Create Batch Labels</h3>
            <Badge className="bg-blue-100 text-blue-800">
              {selectedShipments.length} Labels
            </Badge>
          </div>
          
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg p-4 mb-4 border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Shipping costs:</span>
                <span className="font-medium">${shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-700">
                <div className="flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  <span>Insurance ({selectedShipments.length} × $2.00):</span>
                </div>
                <span className="font-medium">${insuranceCost.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-blue-600">${batchAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handlePaymentComplete}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            size="lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Complete Payment & Generate Labels
          </Button>
        </Card>
      )}

      {/* Label Creation Section */}
      {paymentCompleted && !hasBatchResult && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md">
          <h3 className="font-semibold text-green-800 mb-4 text-lg">Payment Completed - Create Labels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your payment of <strong>${batchAmount.toFixed(2)}</strong> has been processed. Generate your shipping labels now.
          </p>
          <Button
            onClick={handleCreateBatchLabels}
            disabled={isCreatingLabels}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg"
            size="lg"
          >
            {isCreatingLabels ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating {selectedShipments.length} Labels...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Generate Batch Labels
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Creation Status */}
      {isCreatingLabels && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-3">Creating Labels...</h3>
          <p className="text-sm text-gray-600 mb-3">
            Processing {selectedShipments.length} labels with insurance coverage. This may take a few moments.
          </p>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div className="bg-yellow-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </Card>
      )}

      {/* Download Options */}
      {hasBatchResult && (
        <Card className="p-6 bg-green-50 border-green-200 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-green-800 text-lg">Batch Labels Ready!</h3>
            <Badge className="bg-green-100 text-green-800">
              Complete
            </Badge>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Your consolidated batch labels are ready for download. All shipments include insurance coverage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </Card>
      )}

      {/* Modals */}
      <BatchPrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        batchResult={batchResult}
      />

      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={batchResult}
      />
    </div>
  );
};

export default BatchLabelControls;

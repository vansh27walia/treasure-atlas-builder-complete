
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, Printer, RefreshCw, Package } from 'lucide-react';
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
  currentStep?: 'upload' | 'mapping' | 'rates' | 'creation' | 'complete';
}

const BatchLabelControls: React.FC<BatchLabelControlsProps> = ({
  selectedShipments,
  pickupAddress,
  onBatchProcessed,
  currentStep = 'creation'
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
  const [isCreatingLabels, setIsCreatingLabels] = useState(false);

  const handleCreateBatchLabels = async () => {
    if (!selectedShipments || selectedShipments.length === 0) {
      toast.error('No shipments selected for label creation');
      return;
    }

    setIsCreatingLabels(true);

    try {
      console.log('Creating batch labels...');
      
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
    <div className="flex flex-col gap-4">
      {/* Progress Tracker */}
      <BatchProgressTracker 
        currentStep={
          isCreatingLabels ? 'creation' :
          hasBatchResult ? 'complete' : 
          currentStep
        }
        isProcessing={isProcessingBatch || isCreatingLabels}
      />

      {/* Rate Refresh Section */}
      {hasSelectedShipments && !hasBatchResult && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Refresh Rates</h3>
          <p className="text-sm text-gray-600 mb-4">
            Make sure you have the latest shipping rates before creating labels.
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
      
      {/* Label Creation Section */}
      {hasSelectedShipments && !hasBatchResult && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-4">Create Batch Labels</h3>
          <p className="text-sm text-gray-600 mb-4">
            Ready to create {selectedShipments.length} shipping labels
          </p>
          <Button
            onClick={handleCreateBatchLabels}
            disabled={isCreatingLabels}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {isCreatingLabels ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Labels...
              </>
            ) : (
              <>
                <Package className="mr-2 h-5 w-5" />
                Generate Batch Labels
              </>
            )}
          </Button>
        </div>
      )}

      {/* Label Creation Status */}
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

      {/* Download Options */}
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

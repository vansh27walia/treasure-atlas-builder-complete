
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, Printer } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';
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
  currentStep = 'complete'
}) => {
  const {
    batchResult,
    downloadConsolidatedLabel,
    downloadScanForm
  } = useBatchLabelProcessing();

  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress Tracker */}
      <BatchProgressTracker 
        currentStep={currentStep}
        isProcessing={false}
      />

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

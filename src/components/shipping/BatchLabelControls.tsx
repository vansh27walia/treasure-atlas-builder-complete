
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, Mail, Printer } from 'lucide-react';
import { useBatchLabelProcessing } from '@/hooks/useBatchLabelProcessing';
import BatchPrintPreviewModal from './BatchPrintPreviewModal';
import EmailLabelsModal from './EmailLabelsModal';

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

  const handlePrintBatchLabels = async () => {
    try {
      const result = await processBatchLabels(selectedShipments, pickupAddress);
      if (result && onBatchProcessed) {
        onBatchProcessed(result);
      }
      setShowPrintPreview(true);
    } catch (error) {
      console.error('Failed to process batch labels:', error);
    }
  };

  const hasSelectedShipments = selectedShipments && selectedShipments.length > 0;
  const hasBatchResult = batchResult && batchResult.consolidatedLabelUrls;

  return (
    <div className="flex items-center gap-2">
      {/* Print Batch Labels Button */}
      <Button
        onClick={handlePrintBatchLabels}
        disabled={!hasSelectedShipments || isProcessingBatch}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Printer className="mr-2 h-4 w-4" />
        {isProcessingBatch ? 'Processing...' : 'Print Batch Labels'}
      </Button>

      {/* Download Options Dropdown */}
      {hasBatchResult && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Download className="mr-2 h-4 w-4" />
              Download
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {batchResult.consolidatedLabelUrls.pdf && (
              <DropdownMenuItem onClick={() => downloadConsolidatedLabel('pdf')}>
                <Download className="mr-2 h-4 w-4" />
                Download Consolidated PDF
              </DropdownMenuItem>
            )}
            {batchResult.consolidatedLabelUrls.png && (
              <DropdownMenuItem onClick={() => downloadConsolidatedLabel('png')}>
                <Download className="mr-2 h-4 w-4" />
                Download Consolidated PNG
              </DropdownMenuItem>
            )}
            {batchResult.consolidatedLabelUrls.zpl && (
              <DropdownMenuItem onClick={() => downloadConsolidatedLabel('zpl')}>
                <Download className="mr-2 h-4 w-4" />
                Download Consolidated ZPL
              </DropdownMenuItem>
            )}
            {batchResult.consolidatedLabelUrls.epl && (
              <DropdownMenuItem onClick={() => downloadConsolidatedLabel('epl')}>
                <Download className="mr-2 h-4 w-4" />
                Download Consolidated EPL
              </DropdownMenuItem>
            )}
            {batchResult.scanFormUrl && (
              <DropdownMenuItem onClick={downloadScanForm}>
                <Download className="mr-2 h-4 w-4" />
                Download Scan Form
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Email Labels Button */}
      {hasBatchResult && (
        <Button
          onClick={() => setShowEmailModal(true)}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <Mail className="mr-2 h-4 w-4" />
          Email Labels
        </Button>
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

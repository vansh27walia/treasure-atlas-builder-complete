
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, X } from 'lucide-react';
import { BatchResult } from '@/hooks/useBatchLabelProcessing';

interface BatchPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: BatchResult | null;
}

const BatchPrintPreviewModal: React.FC<BatchPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const handlePrint = () => {
    if (batchResult?.consolidatedLabelUrls.pdf) {
      window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
    }
  };

  const handleDownload = () => {
    if (batchResult?.consolidatedLabelUrls.pdf) {
      const link = document.createElement('a');
      link.href = batchResult.consolidatedLabelUrls.pdf;
      link.download = `batch_labels_${Date.now()}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Batch Label Print Preview</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {batchResult?.consolidatedLabelUrls.pdf ? (
            <div className="space-y-4">
              <div className="flex gap-2 justify-end border-b pb-4">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Labels
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden bg-white">
                <iframe
                  src={batchResult.consolidatedLabelUrls.pdf}
                  className="w-full h-[600px] border-0"
                  title="Batch Labels Preview"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No consolidated PDF available for preview</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchPrintPreviewModal;

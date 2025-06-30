
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Mail, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BatchPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
      png?: string;
    };
    scanFormUrl?: string;
  } | null;
}

const BatchPrintPreviewModal: React.FC<BatchPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [printFormat, setPrintFormat] = useState<'4x6' | '8.5x11-single' | '8.5x11-double'>('4x6');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleDownload = (format: 'pdf' | 'zpl' | 'epl') => {
    const url = batchResult?.consolidatedLabelUrls[format];
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${Date.now()}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    if (batchResult?.consolidatedLabelUrls.pdf) {
      const printWindow = window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const getFormatDescription = () => {
    switch (printFormat) {
      case '4x6':
        return 'Standard shipping label size (4" x 6")';
      case '8.5x11-single':
        return 'Single label per page (8.5" x 11")';
      case '8.5x11-double':
        return 'Two labels per page vertically (8.5" x 11")';
      default:
        return '';
    }
  };

  if (!batchResult?.consolidatedLabelUrls.pdf) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Batch Labels Print Preview</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Format Selection */}
            <Card className="p-4">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Print Format Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label Layout
                    </label>
                    <Select value={printFormat} onValueChange={(value: any) => setPrintFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4x6">4" × 6" Standard</SelectItem>
                        <SelectItem value="8.5x11-single">8.5" × 11" Single Label</SelectItem>
                        <SelectItem value="8.5x11-double">8.5" × 11" Two Labels</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">{getFormatDescription()}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* PDF Preview */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Label Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '500px' }}>
                <iframe
                  src={batchResult.consolidatedLabelUrls.pdf}
                  width="100%"
                  height="100%"
                  title="Batch Labels Preview"
                  className="border-0"
                />
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-between">
              <div className="flex gap-3">
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Labels
                </Button>
                
                <Button 
                  onClick={() => setShowEmailModal(true)}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Labels
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload('pdf')}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                
                <Button
                  onClick={() => handleDownload('zpl')}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  ZPL
                </Button>
                
                <Button
                  onClick={() => handleDownload('epl')}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  EPL
                </Button>
              </div>
            </div>

            {/* Scan Form Section */}
            {batchResult.scanFormUrl && (
              <Card className="p-4 border-blue-200 bg-blue-50">
                <h3 className="font-medium text-blue-900 mb-2">Pickup Manifest</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download the pickup manifest for carrier collection
                </p>
                <Button
                  onClick={() => {
                    if (batchResult.scanFormUrl) {
                      const link = document.createElement('a');
                      link.href = batchResult.scanFormUrl;
                      link.download = `pickup_manifest_${Date.now()}.pdf`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Manifest
                </Button>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailLabelsModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          batchResult={batchResult}
        />
      )}
    </>
  );
};

// Placeholder EmailLabelsModal component - will be implemented separately
const EmailLabelsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  batchResult: any;
}> = ({ isOpen, onClose, batchResult }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Labels</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Email functionality will be implemented here</p>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchPrintPreviewModal;

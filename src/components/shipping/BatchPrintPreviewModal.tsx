
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, Mail, FileText, File } from 'lucide-react';
import { Card } from '@/components/ui/card';
import EmailLabelsModal from './EmailLabelsModal';

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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center">
              <File className="h-5 w-5 mr-2" />
              Batch Labels Print Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Top Action Bar - Similar to Individual Print Preview */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-4">
                {/* Format Selection */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Layout:</label>
                  <Select value={printFormat} onValueChange={(value: any) => setPrintFormat(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4x6">4" × 6" Standard</SelectItem>
                      <SelectItem value="8.5x11-single">8.5" × 11" Single</SelectItem>
                      <SelectItem value="8.5x11-double">8.5" × 11" Double</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="text-xs text-gray-500">
                  {getFormatDescription()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Format Buttons */}
                <Button
                  onClick={() => handleDownload('pdf')}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <File className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                
                <Button
                  onClick={() => handleDownload('zpl')}
                  variant="outline"
                  size="sm"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  disabled={!batchResult?.consolidatedLabelUrls.zpl}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  ZPL
                </Button>
                
                <Button
                  onClick={() => handleDownload('epl')}
                  variant="outline"
                  size="sm"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  disabled={!batchResult?.consolidatedLabelUrls.epl}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  EPL
                </Button>

                <div className="border-l border-gray-300 h-6 mx-2"></div>

                {/* Print Button */}
                <Button 
                  onClick={handlePrint} 
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                
                {/* Email Button */}
                <Button 
                  onClick={() => setShowEmailModal(true)}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>

            {/* PDF Preview */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Label Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
                <iframe
                  src={batchResult.consolidatedLabelUrls.pdf}
                  width="100%"
                  height="100%"
                  title="Batch Labels Preview"
                  className="border-0"
                />
              </div>
            </Card>

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

            {/* Format Information */}
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">Print Format Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Current Selection:</strong> {getFormatDescription()}</p>
                <p><strong>Available Formats:</strong> PDF (ready), ZPL {batchResult?.consolidatedLabelUrls.zpl ? '(ready)' : '(not available)'}, EPL {batchResult?.consolidatedLabelUrls.epl ? '(ready)' : '(not available)'}</p>
                <p><strong>Recommended:</strong> Use 4x6 for thermal printers, 8.5x11 for standard office printers</p>
              </div>
            </Card>
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

export default BatchPrintPreviewModal;

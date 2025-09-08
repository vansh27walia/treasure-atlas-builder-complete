import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Mail, X, File, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import EmailLabelsModal from './EmailLabelsModal';

interface IndependentBatchPrintPreviewProps {
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

const IndependentBatchPrintPreview: React.FC<IndependentBatchPrintPreviewProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleDownload = (format: 'pdf' | 'zpl' | 'epl') => {
    const url = batchResult?.consolidatedLabelUrls[format];
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${Date.now()}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloaded batch ${format.toUpperCase()} labels`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} labels`);
    }
  };

  const handleEmailClick = () => {
    setShowEmailModal(true);
  };

  if (!batchResult?.consolidatedLabelUrls.pdf) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold flex items-center">
                <File className="h-5 w-5 mr-2" />
                Batch Labels Print Preview
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Top Action Bar with better Email button placement */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-blue-900">Batch Label Actions</h3>
                <Button 
                  onClick={handleEmailClick}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  size="lg"
                >
                  <Mail className="h-5 w-5 mr-2" />
                  Email Labels
                </Button>
              </div>
            </Card>

            {/* Download Options */}
            <Card className="p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Download Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Batch Label PDF */}
                <Button
                  onClick={() => handleDownload('pdf')}
                  className="h-16 bg-red-600 hover:bg-red-700 text-white flex flex-col items-center justify-center"
                  size="lg"
                >
                  <File className="h-6 w-6 mb-1" />
                  <div className="text-center">
                    <div className="font-semibold">Batch Label PDF</div>
                    <div className="text-xs opacity-90">Download PDF</div>
                  </div>
                </Button>

                {/* Batch Label ZPL - Always show */}
                <Button
                  onClick={() => handleDownload('zpl')}
                  className="h-16 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-center justify-center"
                  size="lg"
                  disabled={!batchResult?.consolidatedLabelUrls.zpl}
                >
                  <FileText className="h-6 w-6 mb-1" />
                  <div className="text-center">
                    <div className="font-semibold">Batch Label ZPL</div>
                    <div className="text-xs opacity-90">
                      {batchResult?.consolidatedLabelUrls.zpl ? 'Download ZPL' : 'Not Available'}
                    </div>
                  </div>
                </Button>

                {/* Batch Label EPL - Always show */}
                <Button
                  onClick={() => handleDownload('epl')}
                  className="h-16 bg-purple-600 hover:bg-purple-700 text-white flex flex-col items-center justify-center"
                  size="lg"
                  disabled={!batchResult?.consolidatedLabelUrls.epl}
                >
                  <FileText className="h-6 w-6 mb-1" />
                  <div className="text-center">
                    <div className="font-semibold">Batch Label EPL</div>
                    <div className="text-xs opacity-90">
                      {batchResult?.consolidatedLabelUrls.epl ? 'Download EPL' : 'Not Available'}
                    </div>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Independent PDF Preview - No format controls */}
            <Card className="p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Label Preview</h4>
              <div className="border rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
                <iframe
                  src={batchResult.consolidatedLabelUrls.pdf}
                  width="100%"
                  height="100%"
                  title="Independent Batch Labels Preview"
                  className="border-0"
                  style={{ 
                    zoom: 1,
                    transform: 'none',
                    transformOrigin: 'top left'
                  }}
                />
              </div>
            </Card>

            {/* Scan Form Section */}
            {batchResult.scanFormUrl && (
              <Card className="p-4 border-green-200 bg-green-50">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Pickup Manifest
                </h4>
                <p className="text-sm text-green-700 mb-3">
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
                      toast.success('Downloaded pickup manifest');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Manifest
                </Button>
              </Card>
            )}

            {/* Simplified Batch Information */}
            <Card className="p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-2">Batch Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Batch ID:</strong> {batchResult.batchId}</p>
                <p><strong>Available Formats:</strong> PDF (ready), ZPL {batchResult?.consolidatedLabelUrls.zpl ? '(ready)' : '(not available)'}, EPL {batchResult?.consolidatedLabelUrls.epl ? '(ready)' : '(not available)'}</p>
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

export default IndependentBatchPrintPreview;
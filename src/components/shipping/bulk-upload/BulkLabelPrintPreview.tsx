
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Mail, Printer, Eye, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import EmailLabelsModal from '@/components/shipping/EmailLabelsModal';

interface BulkLabelPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: {
    batchId: string;
    consolidatedLabelUrls: {
      pdf?: string;
      zpl?: string;
      epl?: string;
      pdfZip?: string;
      zplZip?: string;
      eplZip?: string;
    };
    scanFormUrl?: string;
  };
}

const BulkLabelPrintPreview: React.FC<BulkLabelPrintPreviewProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  const handleDownload = (format: 'pdf' | 'zpl' | 'epl' | 'manifest', isZip: boolean = false) => {
    let url: string | undefined;
    let filename: string;

    switch (format) {
      case 'pdf':
        url = isZip ? batchResult.consolidatedLabelUrls.pdfZip : batchResult.consolidatedLabelUrls.pdf;
        filename = `batch_labels_${batchResult.batchId}${isZip ? '_pdfs.zip' : '.pdf'}`;
        break;
      case 'zpl':
        url = isZip ? batchResult.consolidatedLabelUrls.zplZip : batchResult.consolidatedLabelUrls.zpl;
        filename = `batch_labels_${batchResult.batchId}${isZip ? '_zpls.zip' : '.zpl'}`;
        break;
      case 'epl':
        url = isZip ? batchResult.consolidatedLabelUrls.eplZip : batchResult.consolidatedLabelUrls.epl;
        filename = `batch_labels_${batchResult.batchId}${isZip ? '_epls.zip' : '.epl'}`;
        break;
      case 'manifest':
        url = batchResult.scanFormUrl;
        filename = `manifest_${batchResult.batchId}.pdf`;
        break;
    }

    if (!url) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${format.toUpperCase()} downloaded successfully`);
  };

  const handlePrint = () => {
    if (batchResult.consolidatedLabelUrls.pdf) {
      window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Batch Label Preview - {batchResult.batchId}</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Download Options
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Email Options
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 mt-4">
              <div className="h-full flex flex-col">
                {/* Download All Labels Button - Top Positioned */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-blue-900">Download All Labels</h3>
                      <p className="text-sm text-blue-700">Get all your labels in your preferred format</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownload('pdf')}
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={!batchResult.consolidatedLabelUrls.pdf}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        onClick={() => handleDownload('pdf', true)}
                        variant="outline"
                        disabled={!batchResult.consolidatedLabelUrls.pdfZip}
                      >
                        PDF ZIP
                      </Button>
                      <Button
                        onClick={() => handleDownload('zpl')}
                        variant="outline"
                        disabled={!batchResult.consolidatedLabelUrls.zpl}
                      >
                        ZPL
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Print Button */}
                <div className="mb-4">
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="border-purple-200 hover:bg-purple-50 text-purple-700"
                    disabled={!batchResult.consolidatedLabelUrls.pdf}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print All Labels
                  </Button>
                </div>

                {/* PDF Preview */}
                <div className="flex-1 bg-white border rounded-lg">
                  {batchResult.consolidatedLabelUrls.pdf ? (
                    <iframe
                      src={batchResult.consolidatedLabelUrls.pdf}
                      className="w-full h-full min-h-[600px] border-0 rounded-lg"
                      title="Batch Label Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Preview not available</p>
                        <p className="text-sm">PDF format is required for preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1 mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Consolidated Downloads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleDownload('pdf')}
                      variant="outline"
                      className="p-6 h-auto flex-col border-green-200 hover:bg-green-50"
                      disabled={!batchResult.consolidatedLabelUrls.pdf}
                    >
                      <Download className="h-6 w-6 mb-2 text-green-600" />
                      <span className="font-medium">Merged PDF</span>
                      <span className="text-sm text-gray-600">All labels in one PDF file</span>
                    </Button>

                    <Button
                      onClick={() => handleDownload('zpl')}
                      variant="outline"
                      className="p-6 h-auto flex-col border-blue-200 hover:bg-blue-50"
                      disabled={!batchResult.consolidatedLabelUrls.zpl}
                    >
                      <Download className="h-6 w-6 mb-2 text-blue-600" />
                      <span className="font-medium">ZPL Format</span>
                      <span className="text-sm text-gray-600">For Zebra printers</span>
                    </Button>

                    <Button
                      onClick={() => handleDownload('epl')}
                      variant="outline"
                      className="p-6 h-auto flex-col border-purple-200 hover:bg-purple-50"
                      disabled={!batchResult.consolidatedLabelUrls.epl}
                    >
                      <Download className="h-6 w-6 mb-2 text-purple-600" />
                      <span className="font-medium">EPL Format</span>
                      <span className="text-sm text-gray-600">For EPL printers</span>
                    </Button>

                    <Button
                      onClick={() => handleDownload('manifest')}
                      variant="outline"
                      className="p-6 h-auto flex-col border-orange-200 hover:bg-orange-50"
                      disabled={!batchResult.scanFormUrl}
                    >
                      <Download className="h-6 w-6 mb-2 text-orange-600" />
                      <span className="font-medium">Pickup Manifest</span>
                      <span className="text-sm text-gray-600">For carrier pickup</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Individual Downloads (ZIP)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleDownload('pdf', true)}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      disabled={!batchResult.consolidatedLabelUrls.pdfZip}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Individual PDFs
                    </Button>

                    <Button
                      onClick={() => handleDownload('zpl', true)}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      disabled={!batchResult.consolidatedLabelUrls.zplZip}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Individual ZPLs
                    </Button>

                    <Button
                      onClick={() => handleDownload('epl', true)}
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50"
                      disabled={!batchResult.consolidatedLabelUrls.eplZip}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Individual EPLs
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="flex-1 mt-4">
              <div className="text-center py-12">
                <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Email Your Labels</h3>
                <p className="text-gray-600 mb-6">
                  Send your batch labels directly to your email address in your preferred format
                </p>
                <Button
                  onClick={() => setShowEmailModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Send Email
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <EmailLabelsModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        batchResult={batchResult}
      />
    </>
  );
};

export default BulkLabelPrintPreview;

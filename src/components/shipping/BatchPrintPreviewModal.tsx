
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrinterIcon, Download, Mail, FileText, Package, Eye, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import EmailLabelsModal from './EmailLabelsModal';

interface BatchPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchResult: any;
}

const BatchPrintPreviewModal: React.FC<BatchPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  batchResult
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleDownload = (format: 'pdf' | 'png' | 'zpl' | 'epl') => {
    if (!batchResult?.consolidatedLabelUrls?.[format]) {
      toast.error(`${format.toUpperCase()} format not available`);
      return;
    }

    const link = document.createElement('a');
    link.href = batchResult.consolidatedLabelUrls[format];
    link.download = `shipping_labels_${Date.now()}.${format}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloaded ${format.toUpperCase()} labels`);
  };

  const handlePrint = () => {
    if (!batchResult?.consolidatedLabelUrls?.pdf) {
      toast.error('PDF not available for printing');
      return;
    }

    const printWindow = window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    toast.success('Opening print dialog...');
  };

  const handleDownloadManifest = () => {
    if (!batchResult?.scanFormUrl) {
      toast.error('Pickup manifest not available');
      return;
    }

    const link = document.createElement('a');
    link.href = batchResult.scanFormUrl;
    link.download = `pickup_manifest_${Date.now()}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Downloaded pickup manifest');
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-2xl font-bold">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                Print Preview & Options
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download Options</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Label Preview</h3>
                {batchResult?.consolidatedLabelUrls?.pdf ? (
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      src={batchResult.consolidatedLabelUrls.pdf}
                      className="w-full h-96"
                      title="Label Preview"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No preview available</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="download" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Label Downloads
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleDownload('pdf')}
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={!batchResult?.consolidatedLabelUrls?.pdf}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    
                    <Button
                      onClick={() => handleDownload('png')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!batchResult?.consolidatedLabelUrls?.png}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                    
                    <Button
                      onClick={() => handleDownload('zpl')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!batchResult?.consolidatedLabelUrls?.zpl}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download ZPL (Thermal)
                    </Button>
                    
                    <Button
                      onClick={() => handleDownload('epl')}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={!batchResult?.consolidatedLabelUrls?.epl}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download EPL (Thermal)
                    </Button>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Additional Files
                  </h3>
                  <div className="space-y-3">
                    {batchResult?.scanFormUrl && (
                      <Button
                        onClick={handleDownloadManifest}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Manifest
                      </Button>
                    )}
                    
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                      <p className="font-medium mb-1">Batch Summary:</p>
                      <p>• Total Labels: {batchResult?.totalLabels || 0}</p>
                      <p>• Format: Multiple formats available</p>
                      <p>• Status: Ready for download</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Options
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={handlePrint}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!batchResult?.consolidatedLabelUrls?.pdf}
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print All Labels
                    </Button>
                    
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                      <p className="font-medium mb-1">Print Settings:</p>
                      <p>• Recommended: 4x6 label paper</p>
                      <p>• Scale: 100% (no scaling)</p>
                      <p>• Orientation: Portrait</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Email Options
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowEmailModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Labels
                    </Button>
                    
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                      <p className="font-medium mb-1">Email Features:</p>
                      <p>• Custom subject line</p>
                      <p>• Personal message</p>
                      <p>• PDF + Manifest attached</p>
                    </div>
                  </div>
                </Card>
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

export default BatchPrintPreviewModal;

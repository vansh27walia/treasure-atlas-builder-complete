
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Printer, X, FileText, File, Package } from 'lucide-react';
import { BatchResult } from '@/hooks/useBatchLabelProcessing';
import { toast } from 'sonner';

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
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');

  const handlePrint = () => {
    if (batchResult?.consolidatedLabelUrls.pdf) {
      window.open(batchResult.consolidatedLabelUrls.pdf, '_blank');
    } else {
      toast.error('PDF format not available for printing');
    }
  };

  const handleDownload = (format?: string) => {
    const formatToUse = format || selectedFormat;
    const url = batchResult?.consolidatedLabelUrls[formatToUse as keyof typeof batchResult.consolidatedLabelUrls];
    
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${Date.now()}.${formatToUse}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${formatToUse.toUpperCase()} labels`);
    } else {
      toast.error(`${formatToUse.toUpperCase()} format not available`);
    }
  };

  const handleDownloadManifest = () => {
    if (batchResult?.scanFormUrl) {
      const link = document.createElement('a');
      link.href = batchResult.scanFormUrl;
      link.download = `pickup_manifest_${Date.now()}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Downloading pickup manifest');
    } else {
      toast.error('Pickup manifest not available');
    }
  };

  const availableFormats = batchResult?.consolidatedLabelUrls ? 
    Object.keys(batchResult.consolidatedLabelUrls).filter(format => 
      batchResult.consolidatedLabelUrls[format as keyof typeof batchResult.consolidatedLabelUrls]
    ) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Batch Label Print Preview</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {batchResult?.consolidatedLabelUrls && availableFormats.length > 0 ? (
            <div className="space-y-4">
              {/* Controls Section */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Format:</span>
                  </div>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFormats.map(format => (
                        <SelectItem key={format} value={format}>
                          {format.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
                    <Printer className="mr-2 h-4 w-4" />
                    Print Preview
                  </Button>
                  <Button onClick={() => handleDownload()} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download {selectedFormat.toUpperCase()}
                  </Button>
                </div>
              </div>

              {/* Download Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                    <File className="mr-2 h-4 w-4" />
                    Individual Downloads
                  </h4>
                  <div className="space-y-2">
                    {availableFormats.map(format => (
                      <Button
                        key={format}
                        onClick={() => handleDownload(format)}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-xs"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        {format.toUpperCase()} Labels
                      </Button>
                    ))}
                  </div>
                </div>

                {batchResult.scanFormUrl && (
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Pickup Manifest
                    </h4>
                    <Button
                      onClick={handleDownloadManifest}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                    >
                      <Download className="mr-2 h-3 w-3" />
                      Download Manifest
                    </Button>
                  </div>
                )}

                <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-3">Format Guide</h4>
                  <div className="text-xs text-amber-700 space-y-1">
                    <p><strong>PDF:</strong> Print on regular paper</p>
                    <p><strong>ZPL:</strong> Zebra thermal printers</p>
                    <p><strong>EPL:</strong> Eltron thermal printers</p>
                  </div>
                </div>
              </div>
              
              {/* Preview Section */}
              <div className="border rounded-lg overflow-hidden bg-white">
                {selectedFormat === 'pdf' && batchResult.consolidatedLabelUrls.pdf ? (
                  <iframe
                    src={batchResult.consolidatedLabelUrls.pdf}
                    className="w-full h-[600px] border-0"
                    title="Batch Labels Preview"
                  />
                ) : selectedFormat === 'zpl' && batchResult.consolidatedLabelUrls.zpl ? (
                  <div className="p-6">
                    <h3 className="font-medium mb-4">ZPL Code Preview</h3>
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto">
                      <p className="text-gray-600 mb-2">ZPL code ready for Zebra thermal printers</p>
                      <Button
                        onClick={() => handleDownload('zpl')}
                        className="mb-4"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download ZPL File
                      </Button>
                    </div>
                  </div>
                ) : selectedFormat === 'epl' && batchResult.consolidatedLabelUrls.epl ? (
                  <div className="p-6">
                    <h3 className="font-medium mb-4">EPL Code Preview</h3>
                    <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm max-h-96 overflow-auto">
                      <p className="text-gray-600 mb-2">EPL code ready for Eltron thermal printers</p>
                      <Button
                        onClick={() => handleDownload('epl')}
                        className="mb-4"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download EPL File
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Preview not available for {selectedFormat.toUpperCase()} format</p>
                      <Button
                        onClick={() => handleDownload()}
                        className="mt-4"
                        size="sm"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download {selectedFormat.toUpperCase()}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No consolidated labels available for preview</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchPrintPreviewModal;

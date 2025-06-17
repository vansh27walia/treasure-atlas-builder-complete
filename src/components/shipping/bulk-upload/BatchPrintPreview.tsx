
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Mail, FileText, File, FileImage, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BatchResult {
  consolidatedLabelUrls?: {
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  totalLabels?: number;
}

interface BatchPrintPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  batchResult: BatchResult;
  onDownloadFormat: (format: 'pdf' | 'png' | 'zpl' | 'epl') => void;
  onEmailBatch: () => void;
}

const BatchPrintPreview: React.FC<BatchPrintPreviewProps> = ({
  isOpen,
  onOpenChange,
  batchResult,
  onDownloadFormat,
  onEmailBatch
}) => {
  const formatOptions = [
    {
      format: 'pdf' as const,
      label: 'Combined PDF',
      icon: File,
      color: 'text-red-600 border-red-300',
      available: !!batchResult.consolidatedLabelUrls?.pdf
    },
    {
      format: 'png' as const,
      label: 'Combined PNG',
      icon: FileImage,
      color: 'text-green-600 border-green-300',
      available: !!batchResult.consolidatedLabelUrls?.png
    },
    {
      format: 'zpl' as const,
      label: 'Combined ZPL',
      icon: FileText,
      color: 'text-purple-600 border-purple-300',
      available: !!batchResult.consolidatedLabelUrls?.zpl
    },
    {
      format: 'epl' as const,
      label: 'Combined EPL',
      icon: FileText,
      color: 'text-blue-600 border-blue-300',
      available: !!batchResult.consolidatedLabelUrls?.epl
    }
  ];

  const downloadLocalPdf = async (pdfUrl: string) => {
    try {
      // Download PDF to local storage first, then display
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const localUrl = URL.createObjectURL(blob);
      
      // Open in new window for preview
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head><title>Batch Label Preview</title></head>
            <body style="margin:0;padding:20px;background:#f5f5f5;">
              <div style="text-align:center;margin-bottom:20px;">
                <h2>Batch Label Preview</h2>
                <p>${batchResult.totalLabels || 0} labels combined</p>
              </div>
              <embed src="${localUrl}" type="application/pdf" width="100%" height="800px" />
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error loading PDF for preview:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Batch Print Preview & Download Options
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Download Options */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Download Formats</h3>
            <div className="space-y-3">
              {formatOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Button
                    key={option.format}
                    variant="outline"
                    onClick={() => onDownloadFormat(option.format)}
                    disabled={!option.available}
                    className={`w-full justify-start ${option.color} ${
                      !option.available ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {option.label}
                    {!option.available && (
                      <span className="ml-auto text-xs text-gray-400">Not available</span>
                    )}
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Actions</h4>
              <div className="space-y-2">
                <Button
                  onClick={onEmailBatch}
                  variant="outline"
                  className="w-full justify-start border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Batch Labels
                </Button>
                
                {batchResult.consolidatedLabelUrls?.pdf && (
                  <Button
                    onClick={() => downloadLocalPdf(batchResult.consolidatedLabelUrls.pdf!)}
                    variant="outline"
                    className="w-full justify-start border-purple-300 text-purple-600 hover:bg-purple-50"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Preview
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Side - Preview Area */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Label Preview</h3>
            <Card className="p-6 bg-gray-50 min-h-[400px] flex items-center justify-center">
              {batchResult.consolidatedLabelUrls?.pdf ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-medium mb-2">Batch Labels Ready</h4>
                  <p className="text-gray-600 mb-4">
                    {batchResult.totalLabels || 0} labels combined into batch file
                  </p>
                  <Button
                    onClick={() => downloadLocalPdf(batchResult.consolidatedLabelUrls.pdf!)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Preview Labels
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No preview available</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchPrintPreview;

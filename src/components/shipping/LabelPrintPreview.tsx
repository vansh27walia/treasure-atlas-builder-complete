
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Download, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { toast } from '@/components/ui/sonner';

interface LabelPrintPreviewProps {
  labelUrl: string;
  trackingCode: string | null;
  isOpen: boolean;
  onClose: () => void;
  format: 'pdf' | 'png' | 'zpl';
}

const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({
  labelUrl,
  trackingCode,
  isOpen,
  onClose,
  format
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => {
      toast.success('Label sent to printer');
    },
    content: () => contentRef.current,
    pageStyle: `
      @page {
        size: 4in 6in;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          background: white;
        }
        .print-content {
          width: 4in;
          height: 6in;
          margin: 0;
          padding: 0;
          display: block;
        }
        .print-content img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .print-content iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      }
    `
  });

  const handleDownload = () => {
    if (labelUrl) {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${trackingCode || Date.now()}.${format}`;
      link.click();
      toast.success(`${format.toUpperCase()} label downloaded`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Preview - Shipping Label</span>
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download {format.toUpperCase()}
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Preview optimized for 4"×6" thermal label printers
            </p>
            <p className="text-xs text-gray-500">
              Tracking: {trackingCode || 'N/A'} | Format: {format.toUpperCase()}
            </p>
          </div>

          <div ref={contentRef} className="print-content mx-auto bg-white" style={{ width: '4in', height: '6in' }}>
            {format === 'pdf' ? (
              <iframe 
                src={labelUrl} 
                className="w-full h-full border-0"
                title="PDF Label Preview"
              />
            ) : format === 'png' ? (
              <img 
                src={labelUrl} 
                alt="Shipping Label"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <p className="text-sm font-medium">ZPL Label Preview</p>
                  <p className="text-xs text-gray-600 mt-2">
                    ZPL format is optimized for thermal printers.
                    Use the download button to get the raw ZPL file.
                  </p>
                  <Button onClick={handleDownload} className="mt-4" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download ZPL
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintPreview;

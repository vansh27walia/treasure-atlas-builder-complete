
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface LabelData {
  id: string;
  tracking_code: string;
  label_urls: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  carrier: string;
  customer_name: string;
  customer_address: string;
}

interface PrintPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: LabelData[];
}

const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  open,
  onOpenChange,
  labels
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Shipping Labels - ${new Date().toLocaleDateString()}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .print-break { page-break-after: always; }
        .no-print { display: none; }
      }
    `
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Print Preview - {labels.length} Labels</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-lg bg-white">
          <div ref={printRef} className="p-4">
            {labels.map((label, index) => (
              <div 
                key={label.id} 
                className={`mb-6 ${index < labels.length - 1 ? 'print-break' : ''}`}
              >
                <div className="border-2 border-gray-300 p-4 bg-white">
                  {/* Label Header */}
                  <div className="flex justify-between items-start mb-4 border-b pb-2">
                    <div>
                      <h3 className="font-bold text-lg">{label.carrier} Shipping Label</h3>
                      <p className="text-sm text-gray-600">Tracking: {label.tracking_code}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Label {index + 1} of {labels.length}</p>
                      <p>{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Label Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Address Section */}
                    <div>
                      <h4 className="font-semibold mb-2">Ship To:</h4>
                      <div className="border p-3 bg-gray-50">
                        <p className="font-medium">{label.customer_name}</p>
                        <p className="text-sm whitespace-pre-line">{label.customer_address}</p>
                      </div>
                    </div>

                    {/* Label Image */}
                    <div className="flex justify-center items-center">
                      {label.label_urls.png ? (
                        <img 
                          src={label.label_urls.png} 
                          alt={`Shipping label ${label.tracking_code}`}
                          className="max-w-full h-auto border"
                          style={{ maxHeight: '200px' }}
                        />
                      ) : (
                        <div className="w-48 h-32 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
                          Label Image Not Available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking Info */}
                  <div className="mt-4 pt-2 border-t">
                    <div className="text-center">
                      <p className="font-mono text-lg font-bold">{label.tracking_code}</p>
                      <p className="text-xs text-gray-600">Tracking Number</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t no-print">
          <p className="text-sm text-gray-600">
            {labels.length} label{labels.length !== 1 ? 's' : ''} ready to print
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handlePrint} className="flex items-center space-x-2">
              <Printer className="h-4 w-4" />
              <span>Print Labels</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreviewModal;

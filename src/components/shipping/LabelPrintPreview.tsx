
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

interface LabelPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  labelUrl: string;
  trackingNumber?: string;
}

const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({
  isOpen,
  onClose,
  labelUrl,
  trackingNumber
}) => {
  useEffect(() => {
    if (isOpen && labelUrl) {
      // Small delay to ensure dialog is fully rendered
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [isOpen, labelUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Print Preview - {trackingNumber || 'Shipping Label'}</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="print-content">
          <style jsx>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-content, .print-content * {
                visibility: visible;
              }
              .print-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
          `}</style>
          
          <div className="flex justify-center bg-white">
            {labelUrl ? (
              <iframe
                src={labelUrl}
                className="w-full h-[600px] border-0"
                title="Label Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No label available for preview
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintPreview;

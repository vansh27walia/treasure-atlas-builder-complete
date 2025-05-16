
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface PrintPreviewProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ labelUrl, trackingCode, shipmentDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => contentRef.current,
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => setIsOpen(false),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> Print Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Preview</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(labelUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={contentRef} className="p-6 bg-white">
          {/* Label Image */}
          <div className="mb-6">
            <img 
              src={labelUrl} 
              alt="Shipping Label" 
              className="max-w-full h-auto border border-gray-300"
            />
          </div>
          
          {/* Shipment Details */}
          {shipmentDetails && (
            <div className="border border-gray-300 rounded p-4 mt-4">
              <h3 className="font-semibold text-lg mb-2">Shipment Details</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">From:</p>
                  <p className="whitespace-pre-line">{shipmentDetails.fromAddress}</p>
                </div>
                
                <div>
                  <p className="font-medium">To:</p>
                  <p className="whitespace-pre-line">{shipmentDetails.toAddress}</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Service:</p>
                  <p>{shipmentDetails.carrier} - {shipmentDetails.service}</p>
                </div>
                
                <div>
                  <p className="font-medium">Weight:</p>
                  <p>{shipmentDetails.weight}</p>
                </div>
              </div>
              
              {shipmentDetails.dimensions && (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Dimensions:</p>
                  <p>{shipmentDetails.dimensions}</p>
                </div>
              )}
              
              {trackingCode && (
                <div className="mt-4 text-sm">
                  <p className="font-medium">Tracking Number:</p>
                  <p className="font-mono">{trackingCode}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;

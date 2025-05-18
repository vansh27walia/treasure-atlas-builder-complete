
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

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
  onFormatChange?: (format: string) => void;
  shipmentId?: string;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentDetails,
  onFormatChange,
  shipmentId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => setIsOpen(false),
    content: () => contentRef.current,
  });

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    
    if (onFormatChange) {
      try {
        setIsRegeneratingLabel(true);
        // Call the provided function to update the label format
        onFormatChange(format);
        setIsRegeneratingLabel(false);
      } catch (error) {
        console.error("Error changing label format:", error);
        setIsRegeneratingLabel(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white border-purple-200 hover:bg-purple-50">
          <Printer className="h-4 w-4" /> Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Preview</span>
            <div className="flex gap-2">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  {labelFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrint}
                className="border-purple-200 hover:bg-purple-50"
                disabled={isRegeneratingLabel}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(labelUrl, '_blank')}
                className="border-purple-200 hover:bg-purple-50"
                disabled={isRegeneratingLabel}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                disabled={isRegeneratingLabel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={contentRef} className="p-6 bg-white">
          {/* Label Image */}
          <div className="mb-6">
            <div className="mb-3 text-sm text-gray-500">
              {isRegeneratingLabel ? (
                <div className="flex items-center">
                  <span className="mr-2">Regenerating label with {selectedFormat} format...</span>
                  <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'
              )}
            </div>
            <div className={`mx-auto ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-2xl'}`}>
              {isRegeneratingLabel ? (
                <div className="border border-gray-300 h-64 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-purple-800">Regenerating label...</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={labelUrl} 
                  alt="Shipping Label" 
                  className="max-w-full h-auto border border-gray-300"
                />
              )}
            </div>
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

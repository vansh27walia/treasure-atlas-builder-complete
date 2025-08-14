
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Printer, X, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ConsolidatedLabelUrls } from '@/types/shipping';

const labelFormats = [
  { 
    value: '4x6', 
    label: '4x6" Shipping Label', 
    description: 'Formatted for Thermal Label Printers',
    icon: '📋'
  },
  { 
    value: '8.5x11-left', 
    label: '8.5x11" - 1 Shipping Label per Page - Left Side', 
    description: 'One 4x6" label on the left side of a letter-sized page',
    icon: '📄'
  },
  { 
    value: '8.5x11-right', 
    label: '8.5x11" - 1 Shipping Label per Page - Right Side', 
    description: 'One 4x6" label on the right side of a letter-sized page',
    icon: '📄'
  },
  { 
    value: '8.5x11-2up', 
    label: '8.5x11" - 2 Shipping Labels per Page', 
    description: 'Two 4x6" labels per letter-sized page',
    icon: '📑'
  }
];

interface PrintPreviewProps {
  triggerButton?: React.ReactNode;
  isOpenProp?: boolean;
  onOpenChangeProp?: (open: boolean) => void;
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
  onFormatChange?: (format: string) => Promise<void>;
  onBatchFormatChange?: (format: string) => Promise<void>;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: ConsolidatedLabelUrls;
    scanFormUrl: string | null;
  };
  isBatchPreview?: boolean;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  onFormatChange,
  onBatchFormatChange,
  shipmentId,
  labelUrls,
  batchResult,
  isBatchPreview = false
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChangeProp) {
      onOpenChangeProp(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');

  useEffect(() => {
    if (isBatchPreview) {
      if (batchResult?.consolidatedLabelUrls?.pdf) {
        setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
        setSelectedFormat('8.5x11-2up');
      } else {
        setCurrentPreviewUrl('');
      }
    } else {
      if (labelUrls?.pdf) {
        setCurrentPreviewUrl(labelUrls.pdf);
      } else if (labelUrl && labelUrl.endsWith('.pdf')) {
        setCurrentPreviewUrl(labelUrl);
      } else {
        setCurrentPreviewUrl('');
      }
      setSelectedFormat('4x6');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const handlePrint = () => {
    if (currentPreviewUrl && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        setIsOpen(false);
      } catch (error) {
        console.error("Error printing PDF from iframe:", error);
        toast.error("Failed to initiate print. Please try downloading the PDF and printing it manually.");
      }
    } else {
      toast.error("No PDF preview available to print directly.");
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (isBatchPreview && onBatchFormatChange) {
        await onBatchFormatChange(format);
        toast.success(`Batch label format updated to ${format}.`);
      } else if (!isBatchPreview && onFormatChange) {
        await onFormatChange(format);
        toast.success(`Label format updated to ${format}.`);
      } else {
        // Simulate format change for demo purposes
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(`Format selected: ${labelFormats.find(f => f.value === format)?.label || format}`);
      }
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const selectedFormatInfo = labelFormats.find(f => f.value === selectedFormat);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton}

      <DialogContent className="max-w-6xl max-h-[95vh] bg-white p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Print Preview {trackingCode ? `- ${trackingCode}` : ''}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-full h-12 bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{selectedFormatInfo?.icon}</span>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{selectedFormatInfo?.label}</div>
                        <div className="text-xs text-gray-500">{selectedFormatInfo?.description}</div>
                      </div>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-full">
                  {labelFormats.map(format => (
                    <SelectItem key={format.value} value={format.value} className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{format.icon}</span>
                        <div>
                          <div className="font-medium">{format.label}</div>
                          <div className="text-xs text-gray-500">{format.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-6"
              disabled={isRegeneratingLabel || !currentPreviewUrl}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <div className="flex-1 px-6 py-4 overflow-hidden">
          <div className="h-full bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden">
            {isRegeneratingLabel ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Updating label format...</p>
                <p className="text-sm text-gray-500">Please wait while we generate the new preview</p>
              </div>
            ) : currentPreviewUrl ? (
              <iframe 
                ref={iframeRef}
                src={currentPreviewUrl} 
                className="w-full h-full" 
                title="Label Preview"
                style={{ minHeight: '600px' }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg font-medium">No Preview Available</p>
                <p className="text-sm">Please ensure a valid PDF label is available</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500">
              {isRegeneratingLabel ? (
                "Generating preview..."
              ) : (
                `Preview: ${selectedFormatInfo?.label || 'Unknown format'}`
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;

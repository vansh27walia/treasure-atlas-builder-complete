
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, X, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ConsolidatedLabelUrls } from '@/types/shipping';

const labelFormats = [
  { value: '8.5x11-left', label: '8.5x11" - 1 Shipping Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Shipping Labels per Page', description: 'Two 4x6" labels per letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Shipping Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' }
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
  shipmentDetails,
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
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('placeholder');

  useEffect(() => {
    if (isBatchPreview) {
      if (batchResult?.consolidatedLabelUrls?.pdf) {
        setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
        setPreviewType('pdf');
        setSelectedFormat('8.5x11-2up');
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
    } else {
      if (labelUrls?.pdf) {
        setCurrentPreviewUrl(labelUrls.pdf);
        setPreviewType('pdf');
      } else if (labelUrl && labelUrl.endsWith('.png')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('image');
      } else if (labelUrl) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('pdf');
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
      setSelectedFormat('4x6');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const handlePrint = () => {
    if (previewType === 'pdf' && iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        setIsOpen(false);
      } catch (error) {
        console.error("Error printing PDF from iframe:", error);
        toast.error("Failed to initiate print. Please try downloading the PDF and printing it manually.");
      }
    } else {
      toast.error("No PDF preview available to print directly. Please download the label.");
    }
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (isBatchPreview && onBatchFormatChange) {
        await onBatchFormatChange(format);
        toast.success(`Batch label format updated by server to ${format}.`);
      } else if (!isBatchPreview && onFormatChange) {
        await onFormatChange(format);
        toast.success(`Label format updated by server to ${format}.`);
      } else {
        toast.info(`Format selected: ${labelFormats.find(f => f.value === format)?.label || format}. (Server-side update not configured)`);
      }
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton}

      <DialogContent className="max-w-6xl bg-white sm:rounded-lg h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            disabled={isRegeneratingLabel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Controls Section */}
          <div className="flex-shrink-0 p-6 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-96">
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-full h-16 bg-white border-2 border-gray-200">
                    <div className="flex items-center">
                      <div className="w-8 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center text-xs font-bold">
                        LABEL
                      </div>
                      <div className="text-left">
                        <SelectValue placeholder="Select Format">
                          {selectedFormat && (
                            <div>
                              <div className="font-medium text-base">
                                {labelFormats.find(f => f.value === selectedFormat)?.label}
                              </div>
                              <div className="text-sm text-gray-500">
                                {labelFormats.find(f => f.value === selectedFormat)?.description}
                              </div>
                            </div>
                          )}
                        </SelectValue>
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="w-96">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="h-16">
                        <div className="flex items-center">
                          <div className="w-8 h-10 bg-gray-200 rounded mr-3 flex items-center justify-center text-xs font-bold">
                            LABEL
                          </div>
                          <div>
                            <div className="font-medium">{format.label}</div>
                            <div className="text-sm text-gray-500">{format.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handlePrint}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                disabled={isRegeneratingLabel || previewType !== 'pdf' || !currentPreviewUrl}
              >
                <Printer className="h-5 w-5 mr-2" /> 
                {isBatchPreview ? 'Print Batch Preview' : 'Print Label'}
              </Button>
            </div>
          </div>

          {/* PDF Preview Section */}
          <div className="flex-1 p-6 overflow-hidden bg-gray-100">
            <div className="h-full bg-white rounded-lg shadow-sm border overflow-hidden">
              {isRegeneratingLabel ? (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                    <p className="text-purple-800 font-medium">Regenerating label...</p>
                    <p className="text-gray-600 text-sm mt-1">
                      {labelFormats.find(f => f.value === selectedFormat)?.label}
                    </p>
                  </div>
                </div>
              ) : previewType === 'pdf' && currentPreviewUrl ? (
                <iframe 
                  ref={iframeRef} 
                  src={currentPreviewUrl} 
                  className="w-full h-full border-0" 
                  title="Label Preview"
                />
              ) : previewType === 'image' && currentPreviewUrl ? (
                <div className="h-full flex items-center justify-center p-4">
                  <img 
                    src={currentPreviewUrl} 
                    alt="Shipping Label" 
                    className="max-w-full max-h-full object-contain border border-gray-300" 
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf
                    ? 'A batch PDF is needed for preview.'
                    : 'Preview not available.'
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 p-6 border-t bg-gray-50">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;

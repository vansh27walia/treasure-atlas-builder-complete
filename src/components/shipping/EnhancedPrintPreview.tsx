
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, X, Loader2, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Standard thermal label size (288x432 points)' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels (2-up)', description: 'Two labels per page - top and bottom' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)', description: 'One label at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)', description: 'One label at bottom of letter page' }
];

interface EnhancedPrintPreviewProps {
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
  shipmentId?: string;
}

const EnhancedPrintPreview: React.FC<EnhancedPrintPreviewProps> = ({
  triggerButton,
  isOpenProp,
  onOpenChangeProp,
  labelUrl,
  trackingCode,
  shipmentDetails,
  shipmentId
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load original PDF when dialog opens
  useEffect(() => {
    if (isOpen && labelUrl && !originalPdfBytes) {
      loadOriginalPdf();
    }
  }, [isOpen, labelUrl]);

  const loadOriginalPdf = async () => {
    try {
      const response = await fetch(labelUrl);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setOriginalPdfBytes(bytes);
      setCurrentPreviewUrl(labelUrl); // Start with original
    } catch (error) {
      console.error('Error loading original PDF:', error);
      toast.error('Failed to load label PDF');
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    // Copy pages from original to output PDF context
    const pages = await outputPdf.copyPages(originalPdf, [0]);
    const [labelPage] = pages;

    // Page sizes in points (72 points per inch)
    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 288;   // 4"
    const labelHeight = 432;  // 6"

    if (layoutOption === '4x6') {
      // Keep as original 4x6
      const page = outputPdf.addPage([labelWidth, labelHeight]);
      page.drawPage(labelPage, { 
        x: 0, 
        y: 0, 
        width: labelWidth, 
        height: labelHeight 
      });

    } else if (layoutOption === '8.5x11-2up') {
      // Two labels: top & bottom
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      // Top label
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,  // 30 points from top
        width: labelWidth, 
        height: labelHeight 
      });
      // Bottom label
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,  // 30 points from bottom
        width: labelWidth, 
        height: labelHeight 
      });

    } else if (layoutOption === '8.5x11-top') {
      // Single label at top
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,  // 30 points from top
        width: labelWidth, 
        height: labelHeight 
      });

    } else if (layoutOption === '8.5x11-bottom') {
      // Single label at bottom
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,  // 30 points from bottom
        width: labelWidth, 
        height: labelHeight 
      });
    }

    return await outputPdf.save();
  };

  const handleFormatChange = async (format: string) => {
    if (!originalPdfBytes) {
      toast.error('Original PDF not loaded');
      return;
    }

    setSelectedFormat(format);
    setIsGenerating(true);

    try {
      const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (currentPreviewUrl && currentPreviewUrl !== labelUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      
      setCurrentPreviewUrl(url);
      toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate label format');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!originalPdfBytes) {
      toast.error('No label data available');
      return;
    }

    try {
      const pdfBytes = await generateLabelPDF(originalPdfBytes, selectedFormat);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `shipping_label_${trackingCode || shipmentId || Date.now()}_${selectedFormat}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast.success(`Downloaded ${labelFormats.find(f => f.value === selectedFormat)?.label} label`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download label');
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        toast.success('Print dialog opened');
      } catch (error) {
        console.error("Error printing PDF:", error);
        toast.error("Failed to open print dialog. Please try downloading and printing manually.");
      }
    } else {
      toast.error("Print preview not available");
    }
  };

  const dialogTitleText = `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <>
      {/* Floating Download Button */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000]">
          <Button
            onClick={handleDownload}
            disabled={isGenerating || !originalPdfBytes}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg h-14 px-6 text-lg font-semibold rounded-full"
          >
            <Download className="h-5 w-5 mr-2" />
            Download PDF
          </Button>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {triggerButton ? triggerButton : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50 text-blue-700"
              onClick={handleDownload}
              disabled={!originalPdfBytes}
            >
              <Download className="h-3 w-3 mr-1" />
              Download Label
            </Button>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
                <Eye className="h-3 w-3 mr-1" />
                Print Preview
              </Button>
            </DialogTrigger>
          </div>
        )}

        <DialogContent className="max-w-5xl bg-white sm:rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{dialogTitleText}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <div className="pt-4">
            {/* Format Selection and Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-center items-center mb-6 gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full sm:w-[320px] h-12">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-lg">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-muted-foreground">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrint}
                  className="border-purple-200 hover:bg-purple-50 text-purple-700 h-12 px-6"
                  disabled={isGenerating || !currentPreviewUrl}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="p-6 bg-gray-50 border rounded-lg">
              <div className="mb-6">
                <div className="mb-3 text-sm text-gray-500 text-center">
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label} format...</span>
                    </div>
                  ) : (
                    `Preview: ${labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}`
                  )}
                </div>
                
                <div className={`mx-auto bg-white p-2 shadow-md ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-4xl'}`}>
                  {isGenerating ? (
                    <div className="border border-gray-300 h-96 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                        <p className="text-purple-800">Generating label format...</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={currentPreviewUrl} 
                      style={{ 
                        width: '100%', 
                        height: selectedFormat === '4x6' ? '600px' : '800px', 
                        border: '1px solid #ccc' 
                      }} 
                      title="Label Preview"
                    />
                  ) : (
                    <div className="border border-gray-300 h-96 flex items-center justify-center text-gray-500">
                      Loading label preview...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-start pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedPrintPreview;


import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, FileText, Mail, ExternalLink, Search, Eye, Package, Briefcase, Loader2, Files, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsolidatedLabelUrls } from '@/types/shipping';
import { PDFDocument } from 'pdf-lib';
import LabelFormatter from './LabelFormatter';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Standard thermal label size for direct printing' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels (2-up)', description: 'Two labels per page - top and bottom' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)', description: 'One label at top of letter page' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)', description: 'One label at bottom of letter page' }
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
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const [showLabelFormatter, setShowLabelFormatter] = useState(false);

  // Load and process PDF for client-side format conversion
  useEffect(() => {
    if (isBatchPreview) {
      if (batchResult?.consolidatedLabelUrls?.pdf) {
        setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
        setPreviewType('pdf');
        setSelectedFormat('8.5x11-2up');
        loadPdfBytes(batchResult.consolidatedLabelUrls.pdf);
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
    } else {
      if (labelUrls?.pdf) {
        setCurrentPreviewUrl(labelUrls.pdf);
        setPreviewType('pdf');
        loadPdfBytes(labelUrls.pdf);
      } else if (labelUrl && labelUrl.endsWith('.png')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('image');
      } else if (labelUrl && labelUrl.endsWith('.pdf')) {
        setCurrentPreviewUrl(labelUrl);
        setPreviewType('pdf');
        loadPdfBytes(labelUrl);
      } else {
        setCurrentPreviewUrl('');
        setPreviewType('placeholder');
      }
      setSelectedFormat('4x6');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const loadPdfBytes = async (url: string) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error('Error loading PDF bytes:', error);
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string): Promise<Uint8Array> => {
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();
    
    // Copy pages from original PDF - this returns PDFEmbeddedPage[]
    const embeddedPages = await outputPdf.copyPages(originalPdf, [0]);
    const labelPage = embeddedPages[0]; // This is a PDFEmbeddedPage

    // Page sizes in points (72 points per inch)
    const letterWidth = 612;  // 8.5"
    const letterHeight = 792; // 11"
    const labelWidth = 288;   // 4"
    const labelHeight = 432;  // 6"

    if (layoutOption === '4x6') {
      const page = outputPdf.addPage([labelWidth, labelHeight]);
      page.drawPage(labelPage, { x: 0, y: 0, width: labelWidth, height: labelHeight });
    } else if (layoutOption === '8.5x11-2up') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,
        width: labelWidth, 
        height: labelHeight 
      });
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,
        width: labelWidth, 
        height: labelHeight 
      });
    } else if (layoutOption === '8.5x11-top') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: letterHeight - labelHeight - 30,
        width: labelWidth, 
        height: labelHeight 
      });
    } else if (layoutOption === '8.5x11-bottom') {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      page.drawPage(labelPage, { 
        x: (letterWidth - labelWidth) / 2, 
        y: 30,
        width: labelWidth, 
        height: labelHeight 
      });
    }

    return await outputPdf.save();
  };

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
      if (originalPdfBytes) {
        // Client-side PDF conversion
        const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        if (currentPreviewUrl && !currentPreviewUrl.startsWith('http')) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        
        setCurrentPreviewUrl(url);
        setPreviewType('pdf');
        toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label || format}.`);
      } else if (isBatchPreview && onBatchFormatChange) {
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

  const handleDownload = async () => {
    if (!originalPdfBytes) {
      // Fallback to direct download
      if (labelUrls?.pdf || labelUrl) {
        const url = labelUrls?.pdf || labelUrl;
        downloadFile(url, `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`);
      } else {
        toast.error('No label available for download');
      }
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

  const downloadFile = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`Successfully initiated download for ${fileName}`);
      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file.");
    }
  };

  const isPdfDownloadAvailable = isBatchPreview
    ? !!batchResult?.consolidatedLabelUrls?.pdf
    : (!!labelUrls?.pdf || (labelUrl && labelUrl.endsWith('.pdf')));

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Formatter ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <>
      {/* Enhanced Label Formatter */}
      <LabelFormatter
        isOpen={showLabelFormatter}
        onClose={() => setShowLabelFormatter(false)}
        labelUrl={labelUrl}
        trackingCode={trackingCode || undefined}
        shipmentId={shipmentId}
      />

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
                Label Formatter
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
              disabled={isRegeneratingLabel}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <div className="pt-4">
            {/* Format Selection - Show directly */}
            <div className="flex flex-col items-center mb-6 gap-4">
              <div className="flex justify-center">
                <Select value={selectedFormat} onValueChange={handleFormatChange} disabled={isRegeneratingLabel}>
                  <SelectTrigger className="w-[400px] h-12">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-[9999]">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Format Info Section - No Preview */}
            <div className="p-6 bg-gray-50 border rounded-lg">
              <div className="mb-6">
                <div className="mb-3 text-sm text-gray-500 text-center">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Preparing format...</span>
                    </div>
                  ) : (
                    `Selected Format: ${labelFormats.find(f => f.value === selectedFormat)?.description}`
                  )}
                </div>
                <div className="mx-auto bg-white p-8 shadow-md max-w-md text-center border rounded-lg">
                  {isRegeneratingLabel ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                      <p className="text-purple-800">Preparing format...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-4xl mb-4">📄</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {labelFormats.find(f => f.value === selectedFormat)?.label}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {labelFormats.find(f => f.value === selectedFormat)?.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ready to download in selected format
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Download Button */}
            <div className="flex justify-center mt-6">
              <Button
                onClick={handleDownload}
                disabled={isRegeneratingLabel}
                className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 text-lg font-semibold"
              >
                <Download className="h-5 w-5 mr-2" />
                Download {labelFormats.find(f => f.value === selectedFormat)?.label || 'Label'}
              </Button>
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

export default PrintPreview;

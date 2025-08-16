
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2, Files, Mail } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsolidatedLabelUrls } from '@/types/shipping';
import { PDFDocument } from 'pdf-lib';

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
    
    // Copy pages from original to output PDF context - this returns PDFEmbeddedPage[]
    const embeddedPages = await outputPdf.copyPages(originalPdf, [0]);
    const labelPage = embeddedPages[0]; // This is now a PDFEmbeddedPage

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

  const handleDownloadIndividualFormat = (format: 'png' | 'pdf' | 'zpl') => {
    console.log('Download individual format attempt:', format, labelUrls);
    let urlToDownload = labelUrls?.[format];

    if (format === 'pdf' && !urlToDownload && labelUrl && labelUrl.endsWith('.pdf')) {
      urlToDownload = labelUrl;
    } else if (format === 'png' && !urlToDownload && labelUrl && labelUrl.endsWith('.png')) {
      urlToDownload = labelUrl;
    }

    if (!urlToDownload) {
      console.error(`No URL available for individual ${format} format`);
      toast.error(`${format.toUpperCase()} format not available for this label.`);
      return;
    }
    downloadFile(urlToDownload, `shipping_label_${trackingCode || shipmentId || Date.now()}.${format}`);
  };

  const handleDownloadBatchFormat = (formatType: 'pdf' | 'zpl' | 'epl' | 'pdfZip' | 'zplZip' | 'eplZip') => {
    if (!batchResult?.consolidatedLabelUrls) {
      toast.error('Batch labels not available.');
      return;
    }
    const urls = batchResult.consolidatedLabelUrls;
    let url: string | undefined;
    let downloadName: string;
    let formatName: string;

    switch (formatType) {
      case 'pdf':
        url = urls.pdf;
        formatName = 'Batch PDF';
        downloadName = `batch_labels_${batchResult.batchId}.pdf`;
        break;
      case 'zpl':
        url = urls.zpl;
        formatName = 'Batch ZPL';
        downloadName = `batch_labels_${batchResult.batchId}.zpl`;
        break;
      case 'epl':
        url = urls.epl;
        formatName = 'Batch EPL';
        downloadName = `batch_labels_${batchResult.batchId}.epl`;
        break;
      case 'pdfZip':
        url = urls.pdfZip;
        formatName = 'Batch PDF (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_pdfs.zip`;
        break;
      case 'zplZip':
        url = urls.zplZip;
        formatName = 'Batch ZPL (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_zpls.zip`;
        break;
      case 'eplZip':
        url = urls.eplZip;
        formatName = 'Batch EPL (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_epls.zip`;
        break;
      default:
        toast.error(`Unknown batch format type: ${formatType}`);
        return;
    }

    if (!url) {
      toast.error(`${formatName} not available.`);
      return;
    }

    downloadFile(url, downloadName);
  };

  const handleDownloadAllBatchLabels = () => {
    if (!batchResult?.consolidatedLabelUrls) {
      toast.error('No batch labels available for download.');
      return;
    }

    const { pdfZip, zplZip, eplZip, pdf } = batchResult.consolidatedLabelUrls;

    // Prioritize PDF ZIP, then ZPL ZIP, then EPL ZIP, then single PDF
    if (pdfZip) {
      downloadFile(pdfZip, `batch_labels_${batchResult.batchId}_all_labels.zip`);
    } else if (zplZip) {
      downloadFile(zplZip, `batch_labels_${batchResult.batchId}_all_zpls.zip`);
    } else if (eplZip) {
      downloadFile(eplZip, `batch_labels_${batchResult.batchId}_all_epls.zip`);
    } else if (pdf) {
      downloadFile(pdf, `batch_labels_${batchResult.batchId}.pdf`);
    } else {
      toast.error('No consolidated or ZIP batch label formats available for download.');
    }
  };

  const handleDownloadManifest = () => {
    if (!batchResult?.scanFormUrl) {
      toast.error('Manifest not available');
      return;
    }
    downloadFile(batchResult.scanFormUrl, `manifest_${batchResult.batchId}.pdf`);
  };

  const handleEmailLabels = (isBatch: boolean) => {
    toast.info(`Initiating email process for ${isBatch ? 'batch' : 'individual'} labels...`);
    console.log(`Email request for ${isBatch ? 'batch ID: ' + batchResult?.batchId : 'shipment ID: ' + shipmentId || trackingCode}`);
    // TODO: Implement API call to your backend to send the email
  };

  const hasIndividualDownloadFormats = !isBatchPreview && labelUrls && (labelUrls.png || labelUrls.pdf || labelUrls.zpl || labelUrl);
  const hasBatchDownloads = isBatchPreview && batchResult?.consolidatedLabelUrls &&
    (batchResult.consolidatedLabelUrls.pdf || batchResult.consolidatedLabelUrls.zpl || batchResult.consolidatedLabelUrls.epl ||
      batchResult.consolidatedLabelUrls.pdfZip || batchResult.consolidatedLabelUrls.zplZip || batchResult.consolidatedLabelUrls.eplZip);

  const isPdfDownloadAvailable = isBatchPreview
    ? !!batchResult?.consolidatedLabelUrls?.pdf
    : (!!labelUrls?.pdf || (labelUrl && labelUrl.endsWith('.pdf')));

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId || 'N/A'})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <>
      {/* Floating Download Button - Enhanced Style */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000]">
          <Button
            onClick={handleDownload}
            disabled={isRegeneratingLabel}
            className="bg-green-600 hover:bg-green-700 text-white shadow-xl h-16 px-8 text-lg font-semibold rounded-full transition-all duration-200 hover:scale-105"
          >
            <Download className="h-6 w-6 mr-3" />
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
              disabled={!isPdfDownloadAvailable}
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
              disabled={isRegeneratingLabel}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <div className="pt-4">
            {/* Enhanced Format Selection Bar - Centered Layout */}
            <div className="flex flex-col items-center mb-6 gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-3xl">
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-full sm:w-[380px] h-12 bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Select Print Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border shadow-lg z-[9999]">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handlePrint}
                  className="border-purple-200 hover:bg-purple-50 text-purple-700 h-12 px-6 font-medium"
                  disabled={isRegeneratingLabel || previewType !== 'pdf' || !currentPreviewUrl}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Label
                </Button>
              </div>
            </div>

            {/* Enhanced Preview Section */}
            <div className="p-6 bg-gray-50 border rounded-lg">
              <div className="mb-6">
                <div className="mb-3 text-sm text-gray-500 text-center">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat} format...</span>
                    </div>
                  ) : isBatchPreview ? (
                    `Consolidated PDF Preview for Batch (${labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat})`
                  ) : (
                    `Preview: ${labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}`
                  )}
                </div>
                <div className={`mx-auto bg-white p-2 shadow-md ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-4xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : previewType === 'pdf' && currentPreviewUrl ? (
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
                    <div className="border border-gray-300 h-64 flex items-center justify-center text-gray-500">
                      {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf
                        ? 'A batch PDF is needed for preview.'
                        : previewType === 'image' && currentPreviewUrl
                          ? <img src={currentPreviewUrl} alt="Shipping Label" className="max-w-full h-auto border border-gray-300" />
                          : 'Preview not available.'
                      }
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

export default PrintPreview;

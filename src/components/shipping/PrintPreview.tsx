import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2, Files } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsolidatedLabelUrls } from '@/types/shipping';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('placeholder');

  useEffect(() => {
    if (isBatchPreview && batchResult?.consolidatedLabelUrls?.pdf) {
      setCurrentPreviewUrl(batchResult.consolidatedLabelUrls.pdf);
      setPreviewType('pdf');
    } else if (!isBatchPreview && labelUrls?.pdf) {
      setCurrentPreviewUrl(labelUrls.pdf);
      setPreviewType('pdf');
    } else if (!isBatchPreview && labelUrl) {
      setCurrentPreviewUrl(labelUrl);
      setPreviewType('image');
    } else {
      setCurrentPreviewUrl('');
      setPreviewType('placeholder');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen, batchResult]);

  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || batchResult?.batchId || 'Print'}`,
    onAfterPrint: () => setIsOpen(false),
    content: () => contentRef.current,
  });

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    if (onFormatChange && !isBatchPreview) {
      try {
        setIsRegeneratingLabel(true);
        await onFormatChange(format);
        toast.success(`Label format updated by server.`);
      } catch (error) {
        console.error("Error changing label format via server:", error);
        toast.error("Failed to update label format from server.");
      } finally {
        setIsRegeneratingLabel(false);
      }
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

    if (format === 'png' && !urlToDownload && labelUrl && previewType === 'image') { // Fallback to main labelUrl for PNG
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

  const hasIndividualDownloadFormats = !isBatchPreview && labelUrls && (labelUrls.png || labelUrls.pdf || labelUrls.zpl || labelUrl);
  const hasBatchDownloads = isBatchPreview && batchResult?.consolidatedLabelUrls &&
    (batchResult.consolidatedLabelUrls.pdf || batchResult.consolidatedLabelUrls.zpl || batchResult.consolidatedLabelUrls.epl ||
      batchResult.consolidatedLabelUrls.pdfZip || batchResult.consolidatedLabelUrls.zplZip || batchResult.consolidatedLabelUrls.eplZip);

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
      <Eye className="h-3 w-3 mr-1" />
      {isBatchPreview ? 'Batch Print/Download' : 'Print Preview'}
    </Button>
  );

  const dialogTitleText = isBatchPreview
    ? `Batch Operations (ID: ${batchResult?.batchId})`
    : `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-white overflow-auto">
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

        <div className="flex-1 pt-4 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            {!isBatchPreview && (
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-full sm:w-[280px]">
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
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-purple-200 hover:bg-purple-50 text-purple-700 w-full sm:w-auto"
              disabled={isRegeneratingLabel || previewType === 'placeholder' || !currentPreviewUrl}
            >
              <Printer className="h-4 w-4 mr-2" /> {isBatchPreview ? 'Print Batch Preview' : 'Print Label'}
            </Button>
          </div>

          <div ref={contentRef} className="w-full h-full min-h-[600px] bg-gray-50 border rounded-lg">
            <div className="p-6 w-full h-full">
              <div className="mb-3 text-sm text-gray-500">
                {isRegeneratingLabel ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Regenerating label with {selectedFormat} format...</span>
                  </div>
                ) : isBatchPreview && batchResult?.consolidatedLabelUrls?.pdf ? (
                  'Consolidated PDF Preview for Batch'
                ) : (
                  labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'
                )}
              </div>
              <div className="w-full h-full bg-white shadow-md">
                {isRegeneratingLabel ? (
                  <div className="border border-gray-300 h-96 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                      <p className="text-purple-800">Regenerating label...</p>
                    </div>
                  </div>
                ) : previewType === 'pdf' && currentPreviewUrl ? (
                  <iframe 
                    src={currentPreviewUrl} 
                    className="w-full h-[700px] border border-gray-300" 
                    title="Label Preview"
                  />
                ) : previewType === 'image' && currentPreviewUrl ? (
                  <img
                    src={currentPreviewUrl}
                    alt="Shipping Label"
                    className="w-full h-auto border border-gray-300"
                  />
                ) : (
                  <div className="border border-gray-300 h-96 flex items-center justify-center text-gray-500">
                    Preview not available. {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf && 'A batch PDF is needed for preview.'}
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
  );
};

export default PrintPreview;

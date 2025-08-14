import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2, Files, Mail } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsolidatedLabelUrls } from '@/types/shipping';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x12" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-2">
          {/* Button for direct PDF Download */}
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={isBatchPreview ? () => handleDownloadBatchFormat('pdf') : () => handleDownloadIndividualFormat('pdf')}
            disabled={!isPdfDownloadAvailable}
          >
            <Download className="h-3 w-3 mr-1" />
            Download Label
          </Button>
          {/* Button to open the Print Preview Dialog */}
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

        <Tabs defaultValue={"preview"} className="w-full pt-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            {!isBatchPreview && <TabsTrigger value="individual" disabled={!hasIndividualDownloadFormats}>Individual Formats</TabsTrigger>}
            {isBatchPreview && <TabsTrigger value="batch">Batch Downloads</TabsTrigger>}
            <TabsTrigger value="print_settings">{isBatchPreview ? "Print Batch" : "Print Label"}</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
              {(isBatchPreview || !isBatchPreview) && (
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
                disabled={isRegeneratingLabel || previewType !== 'pdf' || !currentPreviewUrl}
              >
                <Printer className="h-4 w-4 mr-2" /> {isBatchPreview ? 'Print Batch Preview' : 'Print Label'}
              </Button>
            </div>

            <div className="p-6 bg-gray-50 border rounded-lg">
              <div className="mb-6">
                <div className="mb-3 text-sm text-gray-500">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Regenerating label with {labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat} format...</span>
                    </div>
                  ) : isBatchPreview ? (
                    `Consolidated PDF Preview for Batch (${labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat})`
                  ) : (
                    labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'
                  )}
                </div>
                <div className={`mx-auto bg-white p-2 shadow-md ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-2xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : previewType === 'pdf' && currentPreviewUrl ? (
                    <iframe ref={iframeRef} src={currentPreviewUrl} style={{ width: '100%', height: '600px', border: '1px solid #ccc' }} title="Label Preview"></iframe>
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
          </TabsContent>

          {!isBatchPreview && (
            <TabsContent value="individual">
              <div className="space-y-6 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Download Individual Label Formats</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmailLabels(false)}
                    className="border-blue-200 hover:bg-blue-50 text-blue-700"
                    disabled={!labelUrls?.pdf && !(labelUrl && labelUrl.endsWith('.pdf'))}
                  >
                    <Mail className="h-4 w-4 mr-2" /> Email Label
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Choose from different label formats for various printer types and requirements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center hover:border-green-300 transition-colors">
                    <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <h4 className="font-medium mb-2">PNG Format</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      High-quality image format. Perfect for most standard printers and email attachments.
                    </p>
                    <Button
                      onClick={() => handleDownloadIndividualFormat('png')}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={!(labelUrls?.png || (labelUrl && labelUrl.endsWith('.png')))}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PNG
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                    <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                    <h4 className="font-medium mb-2">PDF Format</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Professional document format. Ideal for printing and archiving shipment records.
                    </p>
                    <Button
                      onClick={() => handleDownloadIndividualFormat('pdf')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!(labelUrls?.pdf || (labelUrl && labelUrl.endsWith('.pdf')))}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 text-center hover:border-purple-300 transition-colors">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                    <h4 className="font-medium mb-2">ZPL Format</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Zebra Programming Language. Optimized for thermal label printers and industrial use.
                    </p>
                    <Button
                      onClick={() => handleDownloadIndividualFormat('zpl')}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!labelUrls?.zpl}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download ZPL
                    </Button>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Format Recommendations:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• **PNG:** Best for standard office printers and sharing via email</li>
                    <li>• **PDF:** Professional format for documentation and multi-page printing</li>
                    <li>• **ZPL:** Required for Zebra thermal printers and warehouse operations</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          )}

          {isBatchPreview && (
            <TabsContent value="batch">
              <div className="space-y-6 p-4">
                {/* Consolidated batch action buttons moved to the top */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
                  <div className="flex-grow w-full sm:w-auto">
                    <Button
                      onClick={handleDownloadAllBatchLabels}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md flex items-center justify-center text-md font-semibold"
                      disabled={!hasBatchDownloads}
                    >
                      <Files className="mr-3 h-5 w-5" />
                      Download All Labels
                    </Button>
                  </div>
                  <div className="flex-grow w-full sm:w-auto">
                    <Button
                      onClick={handleDownloadManifest}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-md flex items-center justify-center text-md font-semibold"
                      disabled={!batchResult?.scanFormUrl}
                    >
                      <FileArchive className="mr-3 h-5 w-5" />
                      Download Manifest
                    </Button>
                  </div>
                  <div className="flex-grow w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleEmailLabels(true)}
                      className="w-full border-blue-600 hover:bg-blue-100 text-blue-700 py-3 rounded-md flex items-center justify-center text-md font-semibold"
                      disabled={!hasBatchDownloads}
                    >
                      <Mail className="h-5 w-5 mr-3" /> Email Batch Labels
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Batch Download Options</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Download consolidated files for all shipments in this batch.
                  </p>
                </div>

                {hasBatchDownloads ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(batchResult?.consolidatedLabelUrls?.pdf || batchResult?.consolidatedLabelUrls?.pdfZip) && (
                        <div className="border rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                          <Briefcase className="h-10 w-10 mx-auto mb-2 text-indigo-600" />
                          <h4 className="font-medium mb-2">Batch PDF</h4>
                          <p className="text-xs text-gray-500 mb-3">
                            {batchResult?.consolidatedLabelUrls?.pdf ? "Consolidated PDF file." : "ZIP archive of all PDF labels."}
                          </p>
                          <Button
                            onClick={() => handleDownloadBatchFormat(batchResult?.consolidatedLabelUrls?.pdf ? 'pdf' : 'pdfZip')}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF {batchResult?.consolidatedLabelUrls?.pdf ? "" : "ZIP"}
                          </Button>
                        </div>
                      )}
                      {(batchResult?.consolidatedLabelUrls?.zpl || batchResult?.consolidatedLabelUrls?.zplZip) && (
                        <div className="border rounded-lg p-4 text-center hover:border-teal-300 transition-colors">
                          <Briefcase className="h-10 w-10 mx-auto mb-2 text-teal-600" />
                          <h4 className="font-medium mb-2">Batch ZPL</h4>
                          <p className="text-xs text-gray-500 mb-3">
                            {batchResult?.consolidatedLabelUrls?.zpl ? "Consolidated ZPL file." : "ZIP archive of all ZPL labels."}
                          </p>
                          <Button
                            onClick={() => handleDownloadBatchFormat(batchResult?.consolidatedLabelUrls?.zpl ? 'zpl' : 'zplZip')}
                            className="w-full bg-teal-600 hover:bg-teal-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download ZPL {batchResult?.consolidatedLabelUrls?.zpl ? "" : "ZIP"}
                          </Button>
                        </div>
                      )}
                      {(batchResult?.consolidatedLabelUrls?.epl || batchResult?.consolidatedLabelUrls?.eplZip) && (
                        <div className="border rounded-lg p-4 text-center hover:border-cyan-300 transition-colors">
                          <Briefcase className="h-10 w-10 mx-auto mb-2 text-cyan-600" />
                          <h4 className="font-medium mb-2">Batch EPL</h4>
                          <p className="text-xs text-gray-500 mb-3">
                            {batchResult?.consolidatedLabelUrls?.epl ? "Consolidated EPL file." : "ZIP archive of all EPL labels."}
                          </p>
                          <Button
                            onClick={() => handleDownloadBatchFormat(batchResult?.consolidatedLabelUrls?.epl ? 'epl' : 'eplZip')}
                            className="w-full bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download EPL {batchResult?.consolidatedLabelUrls?.epl ? "" : "ZIP"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h4 className="font-medium text-gray-600 mb-2">No Batch Downloads Available</h4>
                    <p className="text-sm text-gray-500">
                      Batch download options will be available after batch processing.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="print_settings">
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">Print Output</h3>
              {(isBatchPreview || !isBatchPreview) && (
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Print Layout" />
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
              <p className="text-sm text-gray-600">
                {isBatchPreview
                  ? "Select a page layout for the batch PDF preview above. Use your browser's print dialog for final print settings."
                  : "Configure your print settings for optimal label output. The selected layout above will be applied."
                }
              </p>

              <Button
                onClick={handlePrint}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                disabled={isRegeneratingLabel || previewType !== 'pdf' || !currentPreviewUrl}
              >
                <Printer className="mr-2 h-5 w-5" />
                {isBatchPreview ? "Print Batch PDF (via Browser)" : "Print Label Now"}
              </Button>
              {(previewType !== 'pdf' || !currentPreviewUrl) && (
                <p className="text-xs text-center text-red-500">A PDF preview URL must be available to print.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
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
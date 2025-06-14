import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase, Loader2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConsolidatedLabelUrls } from '@/types/shipping'; // Import the updated type

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

interface PrintPreviewProps {
  triggerButton?: React.ReactNode; // Allow custom trigger
  isOpenProp?: boolean; // Control openness from parent
  onOpenChangeProp?: (open: boolean) => void; // Notify parent of open state change
  labelUrl: string; // Primary URL, usually PNG for preview image OR PDF for individual
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
    consolidatedLabelUrls: ConsolidatedLabelUrls; // Use the imported type
    scanFormUrl: string | null;
  };
  isBatchPreview?: boolean; // Flag to indicate if this is for a batch
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
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(labelUrl); // For the img/iframe src in preview
  const [previewType, setPreviewType] = useState<'image' | 'pdf' | 'placeholder'>('image');

  useEffect(() => {
    if (isBatchPreview) {
      // For batch, we might show a placeholder or a representative label if available
      // For now, let's assume the primary focus is download, so preview can be simple.
      setCurrentPreviewUrl(''); // Or a placeholder image/message
      setPreviewType('placeholder');
    } else if (labelUrls?.pdf) {
      setCurrentPreviewUrl(labelUrls.pdf);
      setPreviewType('pdf');
    } else if (labelUrl) {
      setCurrentPreviewUrl(labelUrl); // Fallback to original labelUrl (likely PNG)
      setPreviewType('image');
    } else {
      setCurrentPreviewUrl('');
      setPreviewType('placeholder');
    }
  }, [labelUrl, labelUrls, isBatchPreview, isOpen]); // Re-evaluate when modal opens
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || batchResult?.batchId || 'Print'}`,
    onAfterPrint: () => setIsOpen(false),
    content: () => contentRef.current,
  });

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    // Client-side formatting for print preview is handled by CSS in contentRef for <img>
    // If server-side regeneration is needed (onFormatChange prop), it can be called here.
    if (onFormatChange) {
      try {
        setIsRegeneratingLabel(true);
        await onFormatChange(format); // This might update labelUrl or labelUrls.pdf
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
    // ... keep existing code (downloadFile implementation)
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

  const handleDownloadManifest = () => {
    // ... keep existing code (handleDownloadManifest implementation)
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

        <Tabs defaultValue={isBatchPreview ? "batch" : "preview"} className="w-full pt-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
            {!isBatchPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
            {!isBatchPreview && <TabsTrigger value="individual" disabled={!hasIndividualDownloadFormats}>Individual Formats</TabsTrigger>}
            {isBatchPreview && <TabsTrigger value="batch">Batch Downloads</TabsTrigger>}
            <TabsTrigger value="print_settings">{isBatchPreview ? "Print Batch" : "Print Label"}</TabsTrigger>
          </TabsList>
          
          {!isBatchPreview && (
            <TabsContent value="preview">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
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
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrint}
                  className="border-purple-200 hover:bg-purple-50 text-purple-700 w-full sm:w-auto"
                  disabled={isRegeneratingLabel || previewType === 'placeholder' || !currentPreviewUrl}
                >
                  <Printer className="h-4 w-4 mr-2" /> Print Label
                </Button>
              </div>

              <div ref={contentRef} className="p-6 bg-gray-50 border rounded-lg">
                <div className="mb-6">
                  <div className="mb-3 text-sm text-gray-500">
                    {isRegeneratingLabel ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Regenerating label with {selectedFormat} format...</span>
                      </div>
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
                       <iframe src={currentPreviewUrl} style={{ width: '100%', height: '600px', border: '1px solid #ccc' }} title="Label Preview"></iframe>
                    ) : previewType === 'image' && currentPreviewUrl ? (
                      <img 
                        src={currentPreviewUrl} 
                        alt="Shipping Label" 
                        className="max-w-full h-auto border border-gray-300"
                      />
                    ) : (
                      <div className="border border-gray-300 h-64 flex items-center justify-center text-gray-500">
                          Preview not available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
          
          {!isBatchPreview && (
            <TabsContent value="individual">
              <div className="space-y-6 p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Download Individual Label Formats</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Choose from different label formats for various printer types and requirements.
                  </p>
                </div>
                
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
                      disabled={!(labelUrls?.png || (labelUrl && previewType === 'image'))}
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
                      disabled={!labelUrls?.pdf}
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
                    <li>• <strong>PNG:</strong> Best for standard office printers and sharing via email</li>
                    <li>• <strong>PDF:</strong> Professional format for documentation and multi-page printing</li>
                    <li>• <strong>ZPL:</strong> Required for Zebra thermal printers and warehouse operations</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          )}

          {isBatchPreview && (
            <TabsContent value="batch">
              <div className="space-y-6 p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Batch Download Options</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Download consolidated files for all shipments in this batch, and the carrier manifest.
                  </p>
                </div>

                {hasBatchDownloads ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Batch PDF (Direct or ZIP) */}
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
                      {/* Batch ZPL (Direct or ZIP) */}
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
                      {/* Batch EPL (Direct or ZIP) */}
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

                    {batchResult?.scanFormUrl && (
                      <div className="border-2 border-orange-200 rounded-lg p-6 text-center bg-orange-50">
                        <FileArchive className="h-12 w-12 mx-auto mb-3 text-orange-600" />
                        <h4 className="font-medium mb-2 text-orange-800">Manifest Pick-Up Form</h4>
                        <p className="text-sm text-orange-700 mb-4">
                          Official scan form for carrier pickup. Required for batch shipment pickup scheduling.
                        </p>
                        <Button 
                          onClick={handleDownloadManifest}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Manifest
                        </Button>
                      </div>
                    )}
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
               {!isBatchPreview && (
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange} // This just updates state, actual print formatting is via CSS on contentRef
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
                  ? "If printing a batch PDF, use your browser's print dialog for layout options after opening the PDF."
                  : "Configure your print settings for optimal label output. The selected layout above will be applied."
                }
              </p>
              
              <Button 
                onClick={handlePrint} 
                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                disabled={isRegeneratingLabel || (isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf) || (!isBatchPreview && (previewType === 'placeholder' || !currentPreviewUrl))}
              >
                <Printer className="mr-2 h-5 w-5" />
                {isBatchPreview ? "Print Batch PDF (via Browser)" : "Print Label Now"}
              </Button>
              {isBatchPreview && !batchResult?.consolidatedLabelUrls?.pdf && (
                <p className="text-xs text-center text-red-500">A batch PDF URL must be available to print.</p>
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

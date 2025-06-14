import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye, Package, Briefcase } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

interface PrintPreviewProps {
  labelUrl: string; // Primary URL, usually PNG for preview image
  trackingCode: string | null;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  onFormatChange?: (format: string) => Promise<void>; // For dynamic server-side format regeneration if ever needed
  shipmentId?: string;
  labelUrls?: { // All available individual label URLs
    png?: string;
    pdf?: string;
    zpl?: string;
  };
  batchResult?: { // For batch/consolidated results
    batchId: string;
    consolidatedLabelUrls: { // Updated to reflect ZIP files
        pdfZip?: string;
        zplZip?: string;
        // Old PDF url, if any, might still be present from previous versions but we'll prioritize pdfZip
        pdf?: string; 
    };
    scanFormUrl: string | null;
  };
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentDetails,
  onFormatChange,
  shipmentId,
  labelUrls, // This will contain { png: '...', pdf: '...', zpl: '...' }
  batchResult
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false); // For server-side format changes
  const [currentLabelUrl, setCurrentLabelUrl] = useState(labelUrl); // For the img src in preview
  
  useEffect(() => {
    setCurrentLabelUrl(labelUrl); // Update preview image if labelUrl prop changes
  }, [labelUrl]);
  
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
        await onFormatChange(format);
        setIsRegeneratingLabel(false);
        toast.success(`Label format changed to ${format}`);
      } catch (error) {
        console.error("Error changing label format:", error);
        setIsRegeneratingLabel(false);
        toast.error("Failed to change label format");
      }
    }
  };

  const handleDownloadIndividualFormat = (format: 'png' | 'pdf' | 'zpl') => {
    console.log('Download individual format attempt:', format);
    console.log('Available individual labelUrls:', labelUrls);
    
    const url = labelUrls?.[format];
    
    if (!url || url.trim() === '') {
      // Fallback to main labelUrl if PNG is requested and not explicitly in labelUrls.png
      if (format === 'png' && labelUrl && labelUrl.trim() !== '') {
        const pngUrl = labelUrl;
        console.log(`Using main labelUrl for PNG download: ${pngUrl}`);
        downloadFile(pngUrl, `shipping_label_${trackingCode || Date.now()}.${format}`);
        return;
      }
      console.error(`No URL available for ${format} format`);
      toast.error(`${format.toUpperCase()} format not available for this label.`);
      return;
    }
    
    downloadFile(url, `shipping_label_${trackingCode || Date.now()}.${format}`);
  };

  const downloadFile = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank'; // Open in new tab, browser handles download
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
  }

  const handleDownloadBatchFormat = (fileType: 'pdfZip' | 'zplZip' | 'pdf') => {
    if (!batchResult?.consolidatedLabelUrls) {
        toast.error('Batch labels not available.');
        return;
    }

    let url: string | undefined;
    let downloadName: string;
    let formatName: string;

    if (fileType === 'pdfZip') {
        url = batchResult.consolidatedLabelUrls.pdfZip;
        formatName = 'Batch PDF (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_pdfs.zip`;
    } else if (fileType === 'zplZip') {
        url = batchResult.consolidatedLabelUrls.zplZip;
        formatName = 'Batch ZPL (ZIP)';
        downloadName = `batch_labels_${batchResult.batchId}_zpls.zip`;
    } else if (fileType === 'pdf' && batchResult.consolidatedLabelUrls.pdf) { // Legacy support for single batch PDF
        url = batchResult.consolidatedLabelUrls.pdf;
        formatName = 'Batch PDF';
        downloadName = `batch_labels_${batchResult.batchId}.pdf`;
    } else {
        toast.error(`Requested batch format (${fileType}) not available.`);
        return;
    }
    
    if (!url) {
      toast.error(`${formatName} not available.`);
      return;
    }
    
    downloadFile(url, downloadName);
  };

  const handleDownloadManifest = () => {
    if (!batchResult?.scanFormUrl) {
      toast.error('Manifest not available');
      return;
    }
    downloadFile(batchResult.scanFormUrl, `manifest_${batchResult.batchId}.pdf`);
  };

  const hasIndividualDownloadFormats = labelUrls && (labelUrls.png || labelUrls.pdf || labelUrls.zpl || labelUrl);
  const hasBatchZipDownloads = batchResult?.consolidatedLabelUrls && (batchResult.consolidatedLabelUrls.pdfZip || batchResult.consolidatedLabelUrls.zplZip);
  const hasLegacyBatchPdf = batchResult?.consolidatedLabelUrls?.pdf;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
          <Eye className="h-3 w-3 mr-1" />
          Print Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shipping Label Preview {trackingCode && `(${trackingCode})`}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              disabled={isRegeneratingLabel}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="individual" disabled={!hasIndividualDownloadFormats}>Individual Formats</TabsTrigger>
            <TabsTrigger value="batch" disabled={!hasBatchZipDownloads && !hasLegacyBatchPdf}>Batch Labels</TabsTrigger>
            <TabsTrigger value="print">Print Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <div className="flex justify-between items-center mb-4">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-[280px]">
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
                className="border-purple-200 hover:bg-purple-50 text-purple-700"
                disabled={isRegeneratingLabel || !currentLabelUrl}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>

            <div ref={contentRef} className="p-6 bg-gray-50 border rounded-lg">
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
                <div className={`mx-auto bg-white p-2 shadow-md ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-2xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : currentLabelUrl ? (
                    <img 
                      src={currentLabelUrl} 
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
                    disabled={!(labelUrls?.png || labelUrl)} // Enable if either specific png url or general labelUrl exists
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

          <TabsContent value="batch">
            <div className="space-y-6 p-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Batch/Consolidated Labels & Manifest</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Download consolidated ZIP archives of labels for all shipments and the manifest pick-up form.
                </p>
              </div>

              {hasBatchZipDownloads || hasLegacyBatchPdf ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Batch PDF ZIP */}
                    {batchResult?.consolidatedLabelUrls?.pdfZip && (
                      <div className="border rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                        <Briefcase className="h-10 w-10 mx-auto mb-2 text-indigo-600" />
                        <h4 className="font-medium mb-2">Batch PDF (ZIP)</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          ZIP archive containing all PDF labels.
                        </p>
                        <Button 
                          onClick={() => handleDownloadBatchFormat('pdfZip')}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF ZIP
                        </Button>
                      </div>
                    )}
                     {/* Batch ZPL ZIP */}
                    {batchResult?.consolidatedLabelUrls?.zplZip && (
                      <div className="border rounded-lg p-4 text-center hover:border-teal-300 transition-colors">
                        <Briefcase className="h-10 w-10 mx-auto mb-2 text-teal-600" />
                        <h4 className="font-medium mb-2">Batch ZPL (ZIP)</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          ZIP archive containing all ZPL labels.
                        </p>
                        <Button 
                          onClick={() => handleDownloadBatchFormat('zplZip')}
                          className="w-full bg-teal-600 hover:bg-teal-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download ZPL ZIP
                        </Button>
                      </div>
                    )}
                    {/* Legacy Batch PDF (single file) - show if new zips aren't present but old pdf is */}
                    {batchResult?.consolidatedLabelUrls?.pdf && !batchResult?.consolidatedLabelUrls?.pdfZip && (
                       <div className="border rounded-lg p-4 text-center hover:border-indigo-300 transition-colors">
                        <File className="h-10 w-10 mx-auto mb-2 text-indigo-600" />
                        <h4 className="font-medium mb-2">Batch PDF</h4>
                        <p className="text-xs text-gray-500 mb-3">
                          Consolidated PDF file (legacy).
                        </p>
                        <Button 
                          onClick={() => handleDownloadBatchFormat('pdf')}
                          className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Batch PDF
                        </Button>
                      </div>
                    )}
                  </div>

                  {batchResult.scanFormUrl && (
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
                  <h4 className="font-medium text-gray-600 mb-2">No Batch Labels Available</h4>
                  <p className="text-sm text-gray-500">
                    Batch labels and manifest will be available after generating batch shipments.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="print">
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">Print Settings</h3>
              <p className="text-sm text-gray-600">
                Configure your print settings for optimal label output.
              </p>
              
              <Button 
                onClick={handlePrint} 
                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                disabled={isRegeneratingLabel || !currentLabelUrl}
              >
                <Printer className="mr-2 h-5 w-5" />
                Print Label Now
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;

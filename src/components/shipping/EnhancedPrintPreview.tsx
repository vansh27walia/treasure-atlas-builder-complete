import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X, Eye, File, FileImage, FileText, Mail, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import EmailLabelsModal from './EmailLabelsModal';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer', description: 'Standard thermal label size for direct printing' },
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
  const [activeTab, setActiveTab] = useState('preview');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState('');
  const [originalPdfBytes, setOriginalPdfBytes] = useState<Uint8Array | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load original PDF bytes for format conversion
  useEffect(() => {
    if (labelUrl && isOpen) {
      loadPdfBytes(labelUrl);
      setCurrentPreviewUrl(labelUrl);
    }
  }, [labelUrl, isOpen]);

  const loadPdfBytes = async (url: string) => {
    try {
      console.log('Loading PDF from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('PDF loaded successfully, size:', arrayBuffer.byteLength, 'bytes');
      
      setOriginalPdfBytes(new Uint8Array(arrayBuffer));
    } catch (error) {
      console.error('Error loading PDF bytes:', error);
      toast.error('Failed to load PDF for preview. Please try downloading directly.');
    }
  };

  const generateLabelPDF = async (fileBytes: Uint8Array, layoutOption: string) => {
    const { PDFDocument, degrees } = await import('pdf-lib');
    const originalPdf = await PDFDocument.load(fileBytes);
    const outputPdf = await PDFDocument.create();

    const originalPage = await outputPdf.embedPage(originalPdf.getPage(0));
    
    // Get the original dimensions of the label (e.g., 4x6 inches)
    const { width: originalLabelWidth, height: originalLabelHeight } = originalPage.size();
    
    // Page sizes in points (72 points per inch)
    const letterWidth = 612; // 8.5"
    const letterHeight = 792; // 11"
    
    if (layoutOption === '4x6') {
      const page = outputPdf.addPage([originalLabelWidth, originalLabelHeight]);
      page.drawPage(originalPage);
    } else {
      const page = outputPdf.addPage([letterWidth, letterHeight]);
      
      // Calculate new dimensions after rotation
      const rotatedLabelWidth = originalLabelHeight;
      const rotatedLabelHeight = originalLabelWidth;
      
      // This is the key change: setting the x-coordinate to a fixed position
      // that is much farther to the right. 
      // The value of 550 places the label's bottom-right corner far to the right.
      const xOffset = 550;
      
      const margin = 30;

      if (layoutOption === '8.5x11-2up') {
        const topY = letterHeight - rotatedLabelHeight - margin;
        const bottomY = margin;

        // Draw the top label
        page.drawPage(originalPage, {
          x: xOffset,
          y: topY,
          rotate: degrees(90),
        });

        // Draw the bottom label
        page.drawPage(originalPage, {
          x: xOffset,
          y: bottomY,
          rotate: degrees(90),
        });
      } else if (layoutOption === '8.5x11-top') {
        const topY = letterHeight - rotatedLabelHeight - margin;

        // Draw a single label on the top half
        page.drawPage(originalPage, {
          x: xOffset,
          y: topY,
          rotate: degrees(90),
        });
      } else if (layoutOption === '8.5x11-bottom') {
        const bottomY = margin;

        // Draw a single label on the bottom half
        page.drawPage(originalPage, {
          x: xOffset,
          y: bottomY,
          rotate: degrees(90),
        });
      }
    }
    
    return await outputPdf.save();
  };

  const handleFormatChange = async (format: string) => {
    setSelectedFormat(format);
    setIsRegeneratingLabel(true);

    try {
      if (originalPdfBytes) {
        // Client-side PDF conversion
        const pdfBytes = await generateLabelPDF(originalPdfBytes, format);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        if (currentPreviewUrl && !currentPreviewUrl.startsWith('http')) {
          URL.revokeObjectURL(currentPreviewUrl);
        }
        
        setCurrentPreviewUrl(url);
        toast.success(`Label format updated to ${labelFormats.find(f => f.value === format)?.label || format}.`);
      } else {
        toast.info(`Format selected: ${labelFormats.find(f => f.value === format)?.label || format}.`);
      }
    } catch (error) {
      console.error("Error changing label format:", error);
      toast.error("Failed to update label format.");
    } finally {
      setIsRegeneratingLabel(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} download...`);
      
      let blob: Blob;
      let filename: string;
      
      // ALWAYS download the original file without modifications
      if (format === 'pdf') {
        if (!labelUrl) {
          toast.error('PDF not available for download.');
          return;
        }
        
        const response = await fetch(labelUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/pdf'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
      } else if (format === 'png') {
        const response = await fetch(labelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'image/png' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.png`;
      } else {
        const response = await fetch(labelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'text/plain' });
        filename = `shipping_label_${trackingCode || shipmentId || Date.now()}.zpl`;
      }
      
      const link = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
      
      toast.dismiss();
      toast.success(`${format.toUpperCase()} label downloaded successfully`);
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.dismiss();
      toast.error(`Failed to download ${format.toUpperCase()} label. Please try again.`);
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

  const handleEmailClick = () => {
    setShowEmailModal(true);
  };

  const dialogTitleText = `Shipping Label Preview ${trackingCode ? `(${trackingCode})` : ''}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton ? triggerButton : (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
            onClick={() => handleDownload('pdf')}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 text-purple-700">
              <Eye className="h-3 w-3 mr-1" />
              Print Preview
            </Button>
          </DialogTrigger>
        </div>
      )}

      <DialogContent className="max-w-5xl bg-white sm:rounded-lg h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{dialogTitleText}</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            disabled={isRegeneratingLabel}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col pt-4 overflow-hidden">
          {/* Tabs for Preview/Download */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-10">
              <TabsTrigger value="preview" className="text-sm py-2">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="download" className="text-sm py-2">
                <Download className="h-4 w-4 mr-2" />
                Download
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 flex flex-col overflow-hidden">
              {/* Format Selection - Only in Preview Tab */}
              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Print Format</Label>
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
                  disabled={isRegeneratingLabel}
                >
                  <SelectTrigger className="w-full h-10 bg-white border border-gray-300 hover:border-gray-400 focus:border-blue-500">
                    <SelectValue placeholder="Select Print Format" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg z-[60] max-h-[200px] overflow-y-auto">
                    {labelFormats.map(format => (
                      <SelectItem key={format.value} value={format.value} className="cursor-pointer hover:bg-gray-50 py-3">
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{format.label}</span>
                          <span className="text-xs text-gray-500">{format.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* PDF Preview Container */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 border rounded-lg overflow-hidden relative">
                {isRegeneratingLabel && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="text-sm text-gray-600">Updating label format...</span>
                    </div>
                  </div>
                )}

                <div className="mb-3 text-center">
                  {isRegeneratingLabel ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Generating {labelFormats.find(f => f.value === selectedFormat)?.label || selectedFormat} format...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Preview: {labelFormats.find(f => f.value === selectedFormat)?.description || 'Label Preview'}</p>
                  )}
                </div>

                {/* PDF Preview */}
                <div className={`bg-white p-3 shadow-lg rounded-lg ${selectedFormat === '4x6' ? 'max-w-sm' : 'max-w-3xl'} w-full`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center rounded-lg">
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : currentPreviewUrl ? (
                    <iframe 
                      ref={iframeRef} 
                      src={currentPreviewUrl} 
                      style={{ 
                        width: '100%', 
                        height: selectedFormat === '4x6' ? '400px' : '500px',
                        border: '1px solid #ccc',
                        borderRadius: '6px'
                      }} 
                      title="Label Preview"
                      onLoad={() => console.log('PDF iframe loaded successfully')}
                      onError={(e) => {
                        console.error('PDF iframe error:', e);
                        toast.error('Failed to load PDF preview');
                      }}
                    />
                  ) : (
                    <div className="border border-gray-300 h-96 flex items-center justify-center text-gray-500 rounded-lg">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Loading label preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Print Button - Only in Preview Tab */}
              <div className="pt-4 border-t mt-4">
                <Button
                  onClick={handlePrint}
                  disabled={isRegeneratingLabel || !currentPreviewUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-semibold rounded-lg shadow-md"
                >
                  <Printer className="h-5 w-5 mr-2" />
                  Print Label
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="download" className="flex-1">
              <div className="p-4 space-y-4">
                {/* Email Button at Top */}
                <div className="flex justify-end mb-4">
                  <Button 
                    onClick={handleEmailClick}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Label
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-blue-500 bg-blue-50 hover:bg-blue-100"
                    onClick={() => handleDownload('pdf')}
                  >
                    <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                    <h4 className="font-semibold mb-2">PDF Format</h4>
                    <p className="text-sm text-gray-600 mb-3">Best for printing</p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-green-500 bg-green-50 hover:bg-green-100"
                    onClick={() => handleDownload('png')}
                  >
                    <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                    <h4 className="font-semibold mb-2">PNG Format</h4>
                    <p className="text-sm text-gray-600 mb-3">Image format</p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download PNG
                    </Button>
                  </div>
                
                  <div 
                    className="p-4 border-2 rounded-lg text-center cursor-pointer transition-all hover:shadow-md border-purple-500 bg-purple-50 hover:bg-purple-100"
                    onClick={() => handleDownload('zpl')}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                    <h4 className="font-semibold mb-2">ZPL Format</h4>
                    <p className="text-sm text-gray-600 mb-3">For thermal printers</p>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full h-9">
                      <Download className="h-4 w-4 mr-2" />
                      Download ZPL
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailLabelsModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          batchResult={{
            batchId: shipmentId || 'single-label',
            consolidatedLabelUrls: {
              pdf: labelUrl,
              png: labelUrl,
              zpl: null
            },
            scanFormUrl: null
          }}
        />
      )}
    </Dialog>
  );
};

export default EnhancedPrintPreview;

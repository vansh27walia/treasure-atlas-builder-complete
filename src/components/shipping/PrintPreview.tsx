
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye } from 'lucide-react';
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
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentDetails,
  onFormatChange,
  shipmentId,
  labelUrls
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentLabelUrl, setCurrentLabelUrl] = useState(labelUrl);
  
  // Update currentLabelUrl when labelUrl prop changes
  useEffect(() => {
    setCurrentLabelUrl(labelUrl);
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

  const handleDownloadFormat = (format: 'png' | 'pdf' | 'zpl') => {
    const url = labelUrls?.[format];
    if (!url) {
      toast.error(`${format.toUpperCase()} format not available for this label`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || Date.now()}.${format}`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${format.toUpperCase()} label`);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download label");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50">
          <Eye className="h-3 w-3 mr-1" />
          Print Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shipping Label Preview</span>
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
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="international">International Options</TabsTrigger>
            <TabsTrigger value="print">Print Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <div className="flex justify-between items-center mb-4">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-[200px]">
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
                className="border-purple-200 hover:bg-purple-50"
                disabled={isRegeneratingLabel}
              >
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>

            <div ref={contentRef} className="p-6 bg-white">
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
                <div className={`mx-auto ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-2xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-64 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={currentLabelUrl} 
                      alt="Shipping Label" 
                      className="max-w-full h-auto border border-gray-300"
                    />
                  )}
                </div>
              </div>
              
              {/* Shipment Details */}
              {shipmentDetails && (
                <div className="border border-gray-300 rounded p-4 mt-4">
                  <h3 className="font-semibold text-lg mb-2">Shipment Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">From:</p>
                      <p className="whitespace-pre-line">{shipmentDetails.fromAddress}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">To:</p>
                      <p className="whitespace-pre-line">{shipmentDetails.toAddress}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Service:</p>
                      <p>{shipmentDetails.carrier} - {shipmentDetails.service}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium">Weight:</p>
                      <p>{shipmentDetails.weight}</p>
                    </div>
                  </div>
                  
                  {shipmentDetails.dimensions && (
                    <div className="mt-2 text-sm">
                      <p className="font-medium">Dimensions:</p>
                      <p>{shipmentDetails.dimensions}</p>
                    </div>
                  )}
                  
                  {trackingCode && (
                    <div className="mt-4 text-sm">
                      <p className="font-medium">Tracking Number:</p>
                      <p className="font-mono">{trackingCode}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="international">
            <div className="space-y-6 p-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Download Label in Multiple Formats</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose from different label formats for various printer types and international shipping requirements.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* PNG Format */}
                <div className="border rounded-lg p-4 text-center hover:border-green-300 transition-colors">
                  <FileImage className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <h4 className="font-medium mb-2">PNG Format</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    High-quality image format. Perfect for most standard printers and email attachments.
                  </p>
                  <Button 
                    onClick={() => handleDownloadFormat('png')}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!labelUrls?.png}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
                  </Button>
                </div>

                {/* PDF Format */}
                <div className="border rounded-lg p-4 text-center hover:border-blue-300 transition-colors">
                  <File className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                  <h4 className="font-medium mb-2">PDF Format</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Professional document format. Ideal for printing and archiving shipment records.
                  </p>
                  <Button 
                    onClick={() => handleDownloadFormat('pdf')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={!labelUrls?.pdf}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>

                {/* ZPL Format */}
                <div className="border rounded-lg p-4 text-center hover:border-purple-300 transition-colors">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                  <h4 className="font-medium mb-2">ZPL Format</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Zebra Programming Language. Optimized for thermal label printers and industrial use.
                  </p>
                  <Button 
                    onClick={() => handleDownloadFormat('zpl')}
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

          <TabsContent value="print">
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">Print Settings</h3>
              <p className="text-sm text-gray-600">
                Configure your print settings for optimal label output.
              </p>
              
              <Button 
                onClick={handlePrint} 
                className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                disabled={isRegeneratingLabel}
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

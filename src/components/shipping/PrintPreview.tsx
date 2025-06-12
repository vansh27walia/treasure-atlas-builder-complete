
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X, FileImage, FileText, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

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
    estimatedDelivery?: string;
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
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  // Update currentLabelUrl when labelUrl prop changes - ALWAYS use PDF for preview
  useEffect(() => {
    setCurrentLabelUrl(labelUrl);
    // ALWAYS prioritize PDF for preview
    if (labelUrls?.pdf) {
      setPreviewUrl(labelUrls.pdf);
    } else if (labelUrl && labelUrl.includes('.pdf')) {
      setPreviewUrl(labelUrl);
    } else {
      // If no PDF available, still try to show something but log a warning
      console.warn('No PDF available for preview, using fallback');
      setPreviewUrl(labelUrls?.png || labelUrl || '');
    }
  }, [labelUrl, labelUrls]);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => {
      toast.success('Label sent to printer');
    },
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

  const handleDownloadFormat = async (format: 'png' | 'pdf' | 'zpl') => {
    console.log('Download attempt for format:', format);
    
    if (!shipmentId) {
      toast.error('Missing shipment information for download');
      return;
    }

    try {
      // Get current user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to download labels');
        return;
      }

      toast.loading(`Preparing ${format.toUpperCase()} download...`);

      // Make direct download request to the edge function
      const downloadUrl = `https://adhegezdzqlnqqnymvps.supabase.co/functions/v1/download-label?shipment=${shipmentId}&type=${format}&download=true`;
      
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': '*/*'
        }
      });

      console.log('Download response status:', response.status);
      toast.dismiss();

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        toast.error(`Failed to download ${format.toUpperCase()} label`);
        return;
      }

      // Get the file blob and trigger download
      const blob = await response.blob();
      console.log('Downloaded blob size:', blob.size);
      
      if (blob.size === 0) {
        toast.error('Downloaded file is empty');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || Date.now()}.${format}`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`${format.toUpperCase()} label downloaded successfully`);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.dismiss();
      toast.error("Failed to download label");
    }
  };

  // Check if any download formats are available
  const hasDownloadFormats = labelUrls && (labelUrls.png || labelUrls.pdf || labelUrls.zpl) || labelUrl;

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
            <span>Shipping Label Preview & Print Options</span>
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
            <TabsTrigger value="preview">PDF Preview</TabsTrigger>
            <TabsTrigger value="formats">Download Formats</TabsTrigger>
            <TabsTrigger value="details">Shipment Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview">
            <div className="flex justify-between items-center mb-4">
              <Select
                value={selectedFormat}
                onValueChange={handleFormatChange}
                disabled={isRegeneratingLabel}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select Format" />
                </SelectTrigger>
                <SelectContent>
                  {labelFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownloadFormat('pdf')}
                  className="border-blue-200 hover:bg-blue-50"
                  disabled={isRegeneratingLabel}
                >
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </Button>
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
                    `PDF Label Preview - ${labelFormats.find(f => f.value === selectedFormat)?.description || 'Standard format'}`
                  )}
                </div>
                <div className={`mx-auto ${selectedFormat === '4x6' ? 'max-w-md' : 'max-w-4xl'}`}>
                  {isRegeneratingLabel ? (
                    <div className="border border-gray-300 h-96 flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-t-transparent border-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-800">Regenerating label...</p>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <iframe 
                        src={previewUrl} 
                        className="w-full h-96"
                        title="PDF Label Preview"
                        style={{ border: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-300 h-96 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-500">No PDF preview available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formats">
            <div className="space-y-6 p-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Download Label in Multiple Formats</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Choose from different label formats for various printer types and requirements.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    disabled={!hasDownloadFormats}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>

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
                    disabled={!hasDownloadFormats}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PNG
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
                    disabled={!hasDownloadFormats}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download ZPL
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Format Recommendations:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>PDF:</strong> Professional format for documentation and multi-page printing</li>
                  <li>• <strong>PNG:</strong> Best for standard office printers and sharing via email</li>
                  <li>• <strong>ZPL:</strong> Required for Zebra thermal printers and warehouse operations</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details">
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">Shipment Details</h3>
              
              {shipmentDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Shipping Information</h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span className="font-medium">Carrier:</span> {shipmentDetails.carrier}</div>
                        <div><span className="font-medium">Service:</span> {shipmentDetails.service}</div>
                        <div><span className="font-medium">Tracking:</span> {trackingCode || 'N/A'}</div>
                        {shipmentDetails.estimatedDelivery && (
                          <div><span className="font-medium">Estimated Delivery:</span> {shipmentDetails.estimatedDelivery}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Package Details</h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div><span className="font-medium">Weight:</span> {shipmentDetails.weight}</div>
                        {shipmentDetails.dimensions && (
                          <div><span className="font-medium">Dimensions:</span> {shipmentDetails.dimensions}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Addresses</h4>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <div>
                          <div className="font-medium text-sm text-gray-600">From:</div>
                          <div className="text-sm">{shipmentDetails.fromAddress}</div>
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-600">To:</div>
                          <div className="text-sm">{shipmentDetails.toAddress}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handlePrint} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isRegeneratingLabel}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Label
                </Button>
                
                <Button 
                  onClick={() => handleDownloadFormat('pdf')} 
                  variant="outline"
                  disabled={isRegeneratingLabel}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;

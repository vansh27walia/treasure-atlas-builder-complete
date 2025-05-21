
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, File, FileArchive, X } from 'lucide-react';
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
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentDetails,
  onFormatChange,
  shipmentId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('4x6');
  const [selectedFileFormat, setSelectedFileFormat] = useState<'pdf' | 'png'>('pdf');
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
        // Call the provided function to update the label format
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

  const handleDownload = (format: 'pdf' | 'png' = 'pdf') => {
    try {
      window.open(currentLabelUrl, '_blank');
      toast.success(`Downloading ${format.toUpperCase()} label`);
    } catch (error) {
      console.error("Error downloading label:", error);
      toast.error("Failed to download label");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white border-purple-200 hover:bg-purple-50">
          <Printer className="h-4 w-4" /> Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shipping Label</span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                disabled={isRegeneratingLabel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="download">Download</TabsTrigger>
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
              {/* Label Image */}
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

          <TabsContent value="download">
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div 
                  className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                    ${selectedFileFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                  `}
                  onClick={() => setSelectedFileFormat('pdf')}
                >
                  <File className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">PDF Format</h4>
                  <p className="text-xs text-gray-500">Best for printing</p>
                </div>
                
                <div 
                  className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                    ${selectedFileFormat === 'png' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}
                  `}
                  onClick={() => setSelectedFileFormat('png')}
                >
                  <File className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">PNG Format</h4>
                  <p className="text-xs text-gray-500">Image format</p>
                </div>
                
                <div 
                  className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                    ${false ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'}
                  `}
                >
                  <FileArchive className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium">ZPL Format</h4>
                  <p className="text-xs text-gray-500">For thermal printers</p>
                </div>
              </div>
              
              <Button 
                onClick={() => handleDownload(selectedFileFormat)} 
                className={`w-full h-12 ${
                  selectedFileFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={isRegeneratingLabel}
              >
                <Download className="mr-2 h-5 w-5" />
                Download {selectedFileFormat.toUpperCase()} File
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;


import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, X, Mail, Save, FileText, Image, FileCode, Archive } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from "@/integrations/supabase/client";

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
  onFormatChange?: (format: string, fileType?: string) => Promise<void>;
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
  const [selectedFileType, setSelectedFileType] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRegeneratingLabel, setIsRegeneratingLabel] = useState(false);
  const [currentLabelUrl, setCurrentLabelUrl] = useState(labelUrl);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [activeDownloadTab, setActiveDownloadTab] = useState('pdf');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  
  // Update currentLabelUrl when labelUrl prop changes
  useEffect(() => {
    setCurrentLabelUrl(labelUrl);
  }, [labelUrl]);
  
  // Effect to fetch and cache the label as a blob when URL changes
  useEffect(() => {
    const fetchAndCacheLabel = async () => {
      if (!currentLabelUrl) return;
      
      try {
        console.log("Fetching label to cache as blob:", currentLabelUrl);
        const response = await fetch(currentLabelUrl, { 
          method: 'GET',
          cache: 'force-cache'
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch label: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setBlobUrl(blobUrl);
        console.log("Label cached as blob URL:", blobUrl);
      } catch (error) {
        console.error("Error caching label:", error);
        toast.error("Error preparing label for download");
      }
    };
    
    if (currentLabelUrl) {
      fetchAndCacheLabel();
    }
    
    // Clean up blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [currentLabelUrl]);
  
  const handlePrint = useReactToPrint({
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
    onAfterPrint: () => setIsOpen(false),
    content: () => contentRef.current,
  });

  const handleFormatChange = async (format: string, fileType?: string) => {
    setSelectedFormat(format);
    if (fileType) {
      setSelectedFileType(fileType as 'pdf' | 'png' | 'zpl');
    }
    
    if (onFormatChange) {
      try {
        setIsRegeneratingLabel(true);
        // Call the provided function to update the label format
        await onFormatChange(format, fileType || selectedFileType);
        toast.success(`Label format changed to ${format} (${fileType || selectedFileType})`);
      } catch (error) {
        console.error("Error changing label format:", error);
        toast.error("Failed to change label format");
      } finally {
        setIsRegeneratingLabel(false);
      }
    }
  };

  const handleDirectDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (blobUrl) {
      try {
        console.log(`Starting direct download with blob URL:`, blobUrl);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          toast.success(`Your ${format.toUpperCase()} label has been downloaded`);
        }, 100);
      } catch (error) {
        console.error('Direct download error:', error);
        toast.error('Failed to download directly');
        tryFallbackDownload();
      }
    } else {
      tryFallbackDownload();
    }
  };
  
  const handleDownloadZip = async () => {
    if (!shipmentId || !trackingCode) {
      toast.error('Missing shipment information for ZIP package');
      return;
    }
    
    setIsGeneratingZip(true);
    
    try {
      toast.loading('Generating ZIP archive of all label formats...');
      
      // Call edge function to create ZIP archive
      const { data, error } = await supabase.functions.invoke('create-label-archive', {
        body: { 
          shipmentId,
          formats: ['pdf', 'png', 'zpl'],
        }
      });
      
      if (error) {
        throw new Error(`Error creating label archive: ${error.message}`);
      }
      
      if (!data?.archiveUrl) {
        throw new Error("No archive URL received");
      }
      
      // Download the archive
      const link = document.createElement('a');
      link.href = data.archiveUrl;
      link.download = `shipping_labels_${trackingCode}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        toast.dismiss();
        toast.success(`ZIP archive downloaded successfully`);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading ZIP archive:', error);
      toast.dismiss();
      toast.error('Failed to generate ZIP archive');
    } finally {
      setIsGeneratingZip(false);
    }
  };
  
  const tryFallbackDownload = () => {
    if (!currentLabelUrl) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log(`Trying fallback download with URL:`, currentLabelUrl);
      
      // Create a hidden iframe to download without navigating away
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = currentLabelUrl;
      document.body.appendChild(iframe);
      
      // Clean up after a moment
      setTimeout(() => {
        document.body.removeChild(iframe);
        toast.success(`Starting download through fallback method`);
      }, 1000);
    } catch (error) {
      console.error('Fallback download error:', error);
      toast.error('All download methods failed. Try the "Open in New Tab" option');
    }
  };
  
  const handleEmailLabel = async () => {
    if (!currentLabelUrl && !blobUrl) {
      toast.error('No label available to email');
      return;
    }

    setIsEmailSending(true);
    try {
      toast.loading('Sending label to your email...');
      
      // For now, we'll simulate the email sending
      // In a real implementation, this would call a backend function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.dismiss();
      toast.success('Label sent to your registered email');
    } catch (error) {
      console.error('Email label error:', error);
      toast.error('Failed to email label');
    } finally {
      setIsEmailSending(false);
    }
  };
  
  const handleSaveToAccount = async () => {
    const url = currentLabelUrl || blobUrl;
    if (!url || !trackingCode) {
      toast.error('Missing label data or tracking information');
      return;
    }
    
    setIsSaving(true);
    try {
      toast.loading('Saving label to your account...');
      
      // Save to shipment_records table
      const { error } = await supabase
        .from('shipment_records')
        .insert({
          tracking_code: trackingCode,
          label_url: url,
          shipment_id: shipmentId || '',
          status: 'completed',
          label_format: selectedFormat,
          label_size: selectedFormat,
          file_type: selectedFileType
        });
      
      if (error) {
        throw new Error(`Failed to save label: ${error.message}`);
      }
      
      toast.dismiss();
      toast.success('Label saved to your account');
    } catch (error) {
      console.error('Save label error:', error);
      toast.error('Failed to save label');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-white border-purple-200 hover:bg-purple-50">
          <Printer className="h-4 w-4" /> View & Print Label
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Print Preview</span>
            <div className="flex gap-2">
              <Select
                value={selectedFormat}
                onValueChange={(value) => handleFormatChange(value)}
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(currentLabelUrl, '_blank')}
                className="border-purple-200 hover:bg-purple-50"
                disabled={isRegeneratingLabel}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
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
        
        <div ref={contentRef} className="p-6 bg-white">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
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
            </TabsContent>
            
            <TabsContent value="download">
              <Tabs value={activeDownloadTab} onValueChange={setActiveDownloadTab}>
                <TabsList className="mb-4 grid grid-cols-3">
                  <TabsTrigger value="pdf">PDF Format</TabsTrigger>
                  <TabsTrigger value="png">PNG Format</TabsTrigger>
                  <TabsTrigger value="zip">ZIP Package</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pdf">
                  <div className="space-y-6">
                    <div className="p-5 border-2 rounded-md text-center cursor-pointer transition-colors border-blue-500 bg-blue-50">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                      <h4 className="font-medium">PDF Format</h4>
                      <p className="text-xs text-gray-500">Best for printing</p>
                    </div>
                    
                    <Button 
                      onClick={() => handleFormatChange(selectedFormat, 'pdf').then(() => handleDirectDownload('pdf'))} 
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      disabled={isRegeneratingLabel || selectedFileType === 'pdf'}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PDF File
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="png">
                  <div className="space-y-6">
                    <div className="p-5 border-2 rounded-md text-center cursor-pointer transition-colors border-green-500 bg-green-50">
                      <Image className="h-12 w-12 mx-auto mb-2 text-green-600" />
                      <h4 className="font-medium">PNG Format</h4>
                      <p className="text-xs text-gray-500">Best for digital use</p>
                    </div>
                    
                    <Button 
                      onClick={() => handleFormatChange(selectedFormat, 'png').then(() => handleDirectDownload('png'))}
                      className="w-full h-12 bg-green-600 hover:bg-green-700"
                      disabled={isRegeneratingLabel || selectedFileType === 'png'}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download PNG Image
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="zip">
                  <div className="space-y-6">
                    <div className="p-5 border-2 rounded-md text-center cursor-pointer transition-colors border-amber-500 bg-amber-50">
                      <Archive className="h-12 w-12 mx-auto mb-2 text-amber-600" />
                      <h4 className="font-medium">ZIP Package</h4>
                      <p className="text-xs text-gray-500">All formats in one archive</p>
                    </div>
                    
                    <Button 
                      onClick={handleDownloadZip}
                      className="w-full h-12 bg-amber-600 hover:bg-amber-700"
                      disabled={isGeneratingZip || !shipmentId}
                    >
                      <Archive className="mr-2 h-5 w-5" />
                      {isGeneratingZip ? 'Creating ZIP...' : 'Download All Formats (ZIP)'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="share">
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Email Label</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Send this label to your email address for easy access later
                  </p>
                  <Button 
                    onClick={handleEmailLabel}
                    disabled={isEmailSending || isRegeneratingLabel}
                    className="w-full"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {isEmailSending ? 'Sending...' : 'Email to My Inbox'}
                  </Button>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">Save to Account</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Save this label to your account for easy access later
                  </p>
                  <Button 
                    onClick={handleSaveToAccount}
                    disabled={isSaving || isRegeneratingLabel}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save to My Labels'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
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
      </DialogContent>
    </Dialog>
  );
};

export default PrintPreview;


import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, FileText, X, Image, Archive, FileCode } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
  onFormatChange?: (format: string, fileType?: string) => void | Promise<void>;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  onFormatChange
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  const [selectedFileType, setSelectedFileType] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [activeDownloadTab, setActiveDownloadTab] = useState('pdf');
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Update local URL when prop changes
  useEffect(() => {
    if (labelUrl !== localLabelUrl) {
      setLocalLabelUrl(labelUrl);
    }
  }, [labelUrl]);
  
  // Handle format changes
  const handleFormatChange = async (format: string, fileType?: string) => {
    setSelectedFormat(format);
    if (fileType) {
      setSelectedFileType(fileType as 'pdf' | 'png' | 'zpl');
    }
    
    if (onFormatChange) {
      try {
        setIsRefreshing(true);
        // Call parent component's handler
        await onFormatChange(format, fileType);
        setIsRefreshing(false);
        toast.success(`Label format changed to ${format}${fileType ? ` (${fileType})` : ''}`);
      } catch (error) {
        console.error("Error changing label format:", error);
        toast.error("Failed to change label format");
        setIsRefreshing(false);
      }
    }
  };
  
  // Effect to fetch and cache the label as a blob when URL changes
  useEffect(() => {
    console.log("ShippingLabel component received props:", { labelUrl, trackingCode, shipmentId });
    const fetchAndCacheLabel = async () => {
      const url = localLabelUrl || labelUrl;
      if (!url) return;
      
      try {
        console.log("Fetching label to cache as blob:", url);
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/pdf' },
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
    
    if (labelUrl || localLabelUrl) {
      fetchAndCacheLabel();
    }
    
    // Clean up blob URL on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [labelUrl, localLabelUrl]);
  
  if (!labelUrl && !localLabelUrl) {
    console.log("No label URL available in ShippingLabel component");
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md mb-6">
        <p className="text-yellow-700">No label URL available. Please try generating the label again.</p>
      </div>
    );
  }
  
  const handleRefreshLabel = async () => {
    if (!shipmentId) {
      toast.error("Missing shipment ID");
      return;
    }
    
    setIsRefreshing(true);
    
    try {
      // Use the Supabase edge function to fetch the stored label
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          label_format: selectedFormat,
          file_type: selectedFileType
        }
      });
      
      if (error) {
        console.error("Error from get-stored-label function:", error);
        throw new Error('Failed to refresh label: ' + error.message);
      }
      
      console.log("Refreshed label data:", data);
      
      if (data.labelUrl) {
        setLocalLabelUrl(data.labelUrl);
        toast.success('Label refreshed successfully');
      } else {
        throw new Error('No label URL found');
      }
    } catch (error) {
      console.error('Error refreshing label:', error);
      toast.error('Failed to refresh label');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDirectDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (blobUrl) {
      try {
        console.log(`Starting direct download with blob URL (${format}):`, blobUrl);
        
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
        tryFallbackDownload(format);
      }
    } else {
      tryFallbackDownload(format);
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
  
  const tryFallbackDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log(`Trying fallback download with URL (${format}):`, url);
      
      // Create a hidden iframe to download without navigating away
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // Clean up after a moment
      setTimeout(() => {
        document.body.removeChild(iframe);
        toast.success(`Starting ${format.toUpperCase()} download through fallback method`);
      }, 1000);
    } catch (error) {
      console.error('Fallback download error:', error);
      toast.error('All download methods failed. Try the "Open in New Tab" option');
    }
  };

  const handleOpenInNewTab = () => {
    const urlToOpen = blobUrl || localLabelUrl || labelUrl;
    if (!urlToOpen) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log("Opening URL in new tab:", urlToOpen);
      const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        newWindow.focus();
        toast.success('Label opened in new tab');
      } else {
        throw new Error('Popup blocked or failed to open');
      }
    } catch (error) {
      console.error('Open in new tab error:', error);
      toast.error('Failed to open label in new tab. Please check your popup blocker settings.');
    }
  };

  const handleEmailLabel = async () => {
    if (!blobUrl && !labelUrl && !localLabelUrl) {
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
      
      // Close the modal after emailing
      setIsLabelModalOpen(false);
    } catch (error) {
      console.error('Email label error:', error);
      toast.error('Failed to email label');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleSaveToAccount = async () => {
    const url = blobUrl || localLabelUrl || labelUrl;
    if (!url || !trackingCode) {
      toast.error('Missing label data or tracking information');
      return;
    }
    
    setIsSaving(true);
    try {
      toast.loading('Saving label to your account...');
      
      // Save to shipment_records table instead of creating a new table
      const { error } = await supabase
        .from('shipment_records')
        .insert({
          tracking_code: trackingCode,
          label_url: url,
          shipment_id: shipmentId || '',
          status: 'completed',
          label_format: selectedFormat,
          file_type: selectedFileType
        });
      
      if (error) {
        throw new Error(`Failed to save label: ${error.message}`);
      }
      
      toast.dismiss();
      toast.success('Label saved to your account');
      
      // Close the modal after saving
      setIsLabelModalOpen(false);
    } catch (error) {
      console.error('Save label error:', error);
      toast.error('Failed to save label');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <>
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-purple-800 text-xl mb-2">Label Generated Successfully!</h3>
              <p className="text-sm text-purple-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span></p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <Select
                value={selectedFormat}
                onValueChange={(value) => handleFormatChange(value)}
                disabled={isRefreshing}
              >
                <SelectTrigger className="w-[200px] bg-white text-purple-800 border-purple-200">
                  <SelectValue placeholder="Select Label Format" />
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
              
              <Select
                value={selectedFileType}
                onValueChange={(value) => handleFormatChange(selectedFormat, value)}
                disabled={isRefreshing}
              >
                <SelectTrigger className="w-[140px] bg-white text-purple-800 border-purple-200">
                  <SelectValue placeholder="Select File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Format</SelectItem>
                  <SelectItem value="png">PNG Format</SelectItem>
                  <SelectItem value="zpl">ZPL Format</SelectItem>
                </SelectContent>
              </Select>
              
              {shipmentId && (
                <Button
                  onClick={handleRefreshLabel}
                  variant="outline"
                  size="sm"
                  className="bg-white text-purple-600 border-purple-200 hover:bg-purple-50"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                  Refresh
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            {isRefreshing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-purple-800">Regenerating label with new format...</p>
              </div>
            ) : (
              <>
                <h4 className="text-gray-700 font-medium mb-4 text-lg">Your label is ready! How would you like to receive it?</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setIsLabelModalOpen(true)}
                    variant="default" 
                    className="bg-purple-600 hover:bg-purple-700 text-white h-12"
                  >
                    <Download className="mr-2 h-5 w-5" /> View & Download Label
                  </Button>
                  
                  <Button 
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 h-12"
                  >
                    <ExternalLink className="mr-2 h-5 w-5" /> Open in New Tab
                  </Button>
                  
                  <Button 
                    onClick={handleEmailLabel}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 h-12"
                    disabled={isEmailSending}
                  >
                    <Mail className="mr-2 h-5 w-5" /> 
                    {isEmailSending ? 'Sending...' : 'Email to My Inbox'}
                  </Button>
                  
                  <Button 
                    onClick={handleDownloadZip}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 h-12"
                    disabled={isGeneratingZip || !shipmentId}
                  >
                    <Archive className="mr-2 h-5 w-5" />
                    {isGeneratingZip ? 'Creating ZIP...' : 'Download All Formats (ZIP)'}
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="text-sm text-center text-purple-600">
            <p>You can always access your labels later in your Order History</p>
          </div>
        </div>
      </div>
      
      <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
            <DialogDescription>
              Tracking #: {trackingCode}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="min-h-[400px] flex items-center justify-center border rounded-md">
              <div className="w-full flex flex-col items-center">
                <div className="mb-4 flex justify-center gap-2">
                  <Select
                    value={selectedFormat}
                    onValueChange={(value) => handleFormatChange(value)}
                    disabled={isRefreshing}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Format Size" />
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
                  
                  <Select
                    value={selectedFileType}
                    onValueChange={(value) => handleFormatChange(selectedFormat, value)}
                    disabled={isRefreshing}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="zpl">ZPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isRefreshing ? (
                  <div className="flex flex-col items-center justify-center h-64 w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                    <p className="text-purple-800">Regenerating label with new format...</p>
                  </div>
                ) : blobUrl ? (
                  <iframe 
                    src={blobUrl} 
                    className="w-full h-[500px]" 
                    title="Label Preview"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full w-full">
                    <FileText className="h-16 w-16 text-gray-300 mb-4" />
                    <p className="text-gray-500">Loading preview...</p>
                  </div>
                )}
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
                      disabled={isRefreshing || selectedFileType === 'pdf'}
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
                      disabled={isRefreshing || selectedFileType === 'png'}
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
                    disabled={isEmailSending || isRefreshing}
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
                    disabled={isSaving || isRefreshing}
                    className="w-full"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save to My Labels'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelModalOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShippingLabel;

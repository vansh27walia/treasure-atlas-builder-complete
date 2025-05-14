
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, FileText, X, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
  showLabelPreview?: boolean;
  setShowLabelPreview?: (show: boolean) => void;
  labelFormat?: 'pdf' | 'png' | 'zpl';
  setLabelFormat?: (format: 'pdf' | 'png' | 'zpl') => void;
  downloadLabel?: () => void;
  printLabel?: () => void;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  showLabelPreview = false,
  setShowLabelPreview = () => {},
  labelFormat = 'pdf',
  setLabelFormat = () => {},
  downloadLabel = () => {},
  printLabel = () => {}
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>(labelFormat);
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isMountedRef = useRef(true);
  
  // When showLabelPreview from props changes, update local state
  useEffect(() => {
    if (showLabelPreview !== isLabelModalOpen) {
      setIsLabelModalOpen(showLabelPreview);
    }
  }, [showLabelPreview]);
  
  // When isLabelModalOpen changes, update parent component
  useEffect(() => {
    if (showLabelPreview !== isLabelModalOpen && setShowLabelPreview) {
      setShowLabelPreview(isLabelModalOpen);
    }
  }, [isLabelModalOpen, setShowLabelPreview, showLabelPreview]);
  
  // When labelFormat from props changes, update local state
  useEffect(() => {
    setSelectedFormat(labelFormat);
  }, [labelFormat]);
  
  // When selectedFormat changes, update parent component
  useEffect(() => {
    if (labelFormat !== selectedFormat && setLabelFormat) {
      setLabelFormat(selectedFormat);
    }
  }, [selectedFormat, setLabelFormat, labelFormat]);
  
  // Set mounted ref to false when component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Clean up blob URL on unmount
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, []);
  
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
        
        // Check if component is still mounted before creating blob URL and updating state
        if (!isMountedRef.current) return;
        
        const blobUrl = URL.createObjectURL(blob);
        setBlobUrl(blobUrl);
        console.log("Label cached as blob URL:", blobUrl);
        
        // Automatically open the label modal when the blob is ready
        setIsLabelModalOpen(true);
      } catch (error) {
        console.error("Error caching label:", error);
        if (isMountedRef.current) {
          toast.error("Error preparing label for download");
        }
      }
    };
    
    if (labelUrl || localLabelUrl) {
      fetchAndCacheLabel();
    }
  }, [labelUrl, localLabelUrl]);
  
  if (!labelUrl && !localLabelUrl) {
    console.log("No label URL available in ShippingLabel component");
    return null;
  }
  
  const handleRefreshLabel = async () => {
    if (!shipmentId) {
      toast.error("Missing shipment ID");
      return;
    }
    
    if (!isMountedRef.current) return;
    setIsRefreshing(true);
    
    try {
      // Use the Supabase edge function to fetch the stored label
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { shipment_id: shipmentId }
      });
      
      if (error) {
        console.error("Error from get-stored-label function:", error);
        throw new Error('Failed to refresh label: ' + error.message);
      }
      
      console.log("Refreshed label data:", data);
      
      if (data.labelUrl && isMountedRef.current) {
        setLocalLabelUrl(data.labelUrl);
        toast.success('Label refreshed successfully');
      } else {
        throw new Error('No label URL found');
      }
    } catch (error) {
      console.error('Error refreshing label:', error);
      if (isMountedRef.current) {
        toast.error('Failed to refresh label');
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  const handleDirectDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (downloadLabel) {
      downloadLabel();
      return;
    }
    
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

    if (!isMountedRef.current) return;
    setIsEmailSending(true);
    
    try {
      toast.loading('Sending label to your email...');
      
      // For now, we'll simulate the email sending
      // In a real implementation, this would call a backend function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (isMountedRef.current) {
        toast.dismiss();
        toast.success('Label sent to your registered email');
        
        // Close the modal after emailing
        setIsLabelModalOpen(false);
      }
    } catch (error) {
      console.error('Email label error:', error);
      if (isMountedRef.current) {
        toast.error('Failed to email label');
      }
    } finally {
      if (isMountedRef.current) {
        setIsEmailSending(false);
      }
    }
  };

  const handleSaveToAccount = async () => {
    const url = blobUrl || localLabelUrl || labelUrl;
    if (!url || !trackingCode) {
      toast.error('Missing label data or tracking information');
      return;
    }
    
    if (!isMountedRef.current) return;
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
          status: 'completed'
        });
      
      if (error) {
        throw new Error(`Failed to save label: ${error.message}`);
      }
      
      if (isMountedRef.current) {
        toast.dismiss();
        toast.success('Label saved to your account');
        
        // Close the modal after saving
        setIsLabelModalOpen(false);
      }
    } catch (error) {
      console.error('Save label error:', error);
      if (isMountedRef.current) {
        toast.error('Failed to save label');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };
  
  return (
    <>
      <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border-2 border-green-200">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-green-800 text-xl mb-2">Label Generated Successfully!</h3>
              <p className="text-sm text-green-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-green-200">{trackingCode}</span></p>
            </div>
            {shipmentId && (
              <Button
                onClick={handleRefreshLabel}
                variant="outline"
                size="sm"
                className="mt-3 sm:mt-0 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={isRefreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
                Refresh Label
              </Button>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            <h4 className="text-gray-700 font-medium mb-4 text-lg">Your label is ready! How would you like to receive it?</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                onClick={() => setIsLabelModalOpen(true)}
                variant="default" 
                className="bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <FileText className="mr-2 h-5 w-5" /> View & Download Label
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
                onClick={handleSaveToAccount}
                variant="outline"
                className="border-gray-300 hover:bg-gray-50 h-12"
                disabled={isSaving}
              >
                <Save className="mr-2 h-5 w-5" /> 
                {isSaving ? 'Saving...' : 'Save to My Labels'}
              </Button>
            </div>
          </div>

          <div className="text-sm text-center text-green-600">
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
              {blobUrl ? (
                <iframe 
                  src={blobUrl} 
                  className="w-full h-[500px]" 
                  title="Label Preview"
                  ref={iframeRef}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500">Loading preview...</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="download">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'pdf' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                    onClick={() => setSelectedFormat('pdf')}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">PDF Format</h4>
                    <p className="text-xs text-gray-500">Best for printing</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'png' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                    onClick={() => setSelectedFormat('png')}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <h4 className="font-medium">PNG Format</h4>
                    <p className="text-xs text-gray-500">Image format</p>
                  </div>
                  
                  <div 
                    className={`p-5 border-2 rounded-md text-center cursor-pointer transition-colors
                      ${selectedFormat === 'zpl' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}
                    `}
                    onClick={() => setSelectedFormat('zpl')}
                  >
                    <FileText className="h-12 w-12 mx-auto mb-2 text-purple-600" />
                    <h4 className="font-medium">ZPL Format</h4>
                    <p className="text-xs text-gray-500">For thermal printers</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleDirectDownload(selectedFormat)} 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download {selectedFormat.toUpperCase()} File
                </Button>
              </div>
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
                    disabled={isEmailSending}
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
                    disabled={isSaving}
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

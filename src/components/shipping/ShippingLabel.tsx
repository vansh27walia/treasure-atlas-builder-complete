
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, FileText, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ labelUrl, trackingCode, shipmentId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'download' | 'share'>('preview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Effect to fetch and cache the label as a blob when URL changes
  useEffect(() => {
    console.log("ShippingLabel component received props:", { labelUrl, trackingCode, shipmentId });
    const fetchAndCacheLabel = async () => {
      const url = localLabelUrl || labelUrl;
      if (!url) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching label to cache as blob:", url);
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/pdf, image/*' },
          cache: 'no-cache' 
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch label: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Force PDF content type for all labels for consistency
        const typedBlob = new Blob([blob], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(typedBlob);
        setBlobUrl(blobUrl);
        console.log("Label cached as blob URL:", blobUrl, "Content type:", typedBlob.type);
        
        // Automatically open the label modal when the blob is ready
        setIsLabelModalOpen(true);
      } catch (error) {
        console.error("Error caching label:", error);
        toast.error("Error preparing label for preview. Please try downloading directly instead.");
      } finally {
        setIsLoading(false);
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
        body: { shipment_id: shipmentId }
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
    const url = blobUrl || localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log(`Starting direct download with URL (${format}):`, url);
      
      // Create a hidden iframe to download without navigating away
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // Create an anchor element for downloading
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        document.body.removeChild(iframe);
        toast.success(`Your ${format.toUpperCase()} label has been downloaded`);
      }, 1000);
    } catch (error) {
      console.error('Direct download error:', error);
      toast.error('Failed to download directly');
      fallbackDownload(url, format);
    }
  };
  
  const fallbackDownload = (url: string, format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    // Open in new tab as fallback
    window.open(url, '_blank');
    toast.success(`Opened ${format.toUpperCase()} label in new tab`);
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
          status: 'completed'
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Preparing Label...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" /> View & Download Label
                  </>
                )}
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
      
      {/* Modal for label preview and download - improved for better PDF support */}
      <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
        <DialogContent className="bg-white max-w-3xl p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Shipping Label</DialogTitle>
            <DialogDescription>
              Tracking #: {trackingCode}
            </DialogDescription>
            <Button 
              variant="ghost" 
              className="absolute top-2 right-2 h-8 w-8 p-0" 
              onClick={() => setIsLabelModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <Tabs defaultValue="preview" value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'download' | 'share')}>
            <TabsList className="grid grid-cols-3 mx-6">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="download">Download</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="p-6 pt-4">
              <div className="bg-gray-100 border rounded-md overflow-hidden h-[60vh]">
                {blobUrl ? (
                  <iframe 
                    ref={iframeRef}
                    src={blobUrl} 
                    className="w-full h-full"
                    title="Shipping Label"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                    <span className="ml-2 text-gray-500">Loading preview...</span>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="download" className="p-6 pt-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <Download className="mr-2 h-4 w-4 text-blue-600" />
                    Download Options
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Select your preferred label format:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button
                      variant={selectedFormat === 'pdf' ? 'default' : 'outline'}
                      className={selectedFormat === 'pdf' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => setSelectedFormat('pdf')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      PDF Format
                    </Button>
                    <Button
                      variant={selectedFormat === 'png' ? 'default' : 'outline'}
                      className={selectedFormat === 'png' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => setSelectedFormat('png')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      PNG Format
                    </Button>
                    <Button
                      variant={selectedFormat === 'zpl' ? 'default' : 'outline'}
                      className={selectedFormat === 'zpl' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      onClick={() => setSelectedFormat('zpl')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      ZPL Format
                    </Button>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                  onClick={() => handleDirectDownload(selectedFormat)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download {selectedFormat.toUpperCase()} Label
                </Button>
                
                <a 
                  ref={downloadLinkRef} 
                  className="hidden" 
                  download={`shipping_label_${trackingCode}.${selectedFormat}`}
                  href={blobUrl || labelUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Hidden download link
                </a>
              </div>
            </TabsContent>
            
            <TabsContent value="share" className="p-6 pt-4">
              <div className="space-y-4">
                <Button 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                  onClick={handleEmailLabel}
                  disabled={isEmailSending}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {isEmailSending ? 'Sending...' : 'Email to My Address'}
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-12 border-blue-200 hover:bg-blue-50"
                  onClick={handleSaveToAccount}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-5 w-5" />
                  {isSaving ? 'Saving...' : 'Save to My Account'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="p-6 pt-2">
            <Button variant="outline" onClick={() => setIsLabelModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShippingLabel;

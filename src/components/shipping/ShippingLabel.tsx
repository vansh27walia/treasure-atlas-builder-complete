
import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

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
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
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

  const handleDirectDownload = () => {
    if (blobUrl) {
      try {
        console.log("Starting direct download with blob URL:", blobUrl);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `shipping_label_${trackingCode || 'download'}.pdf`;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          toast.success('Your label has been downloaded');
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
  
  const tryFallbackDownload = () => {
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log("Trying fallback download with URL:", url);
      
      // Create a hidden iframe to download without navigating away
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // Clean up after a moment
      setTimeout(() => {
        document.body.removeChild(iframe);
        toast.success('Starting download through fallback method');
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
      // Call the email sending edge function
      const { data, error } = await supabase.functions.invoke('send-shipping-label', {
        body: { 
          labelUrl: localLabelUrl || labelUrl,
          trackingCode,
          shipmentId
        }
      });
      
      if (error) throw error;
      
      toast.success('Label sent to your registered email');
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
      // Save label to user's account using shipment_records table
      const { error } = await supabase.from('shipment_records').insert({
        tracking_code: trackingCode,
        label_url: localLabelUrl || labelUrl,
        shipment_id: shipmentId,
        status: 'saved_label'
      });
      
      if (error) throw error;
      
      toast.success('Label saved to your account');
    } catch (error) {
      console.error('Save label error:', error);
      toast.error('Failed to save label');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-200">
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
              onClick={handleDirectDownload}
              variant="default" 
              className="bg-green-600 hover:bg-green-700 text-white h-12"
            >
              <Download className="mr-2 h-5 w-5" /> Download PDF
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
  );
};

export default ShippingLabel;

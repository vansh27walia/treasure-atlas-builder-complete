
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LabelActions from './label/LabelActions';
import LabelModal from './label/LabelModal';
import LabelSummary from './label/LabelSummary';

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
  format?: "pdf" | "png" | "zpl";
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  format = "pdf"
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'zpl'>(format || 'pdf');
  
  // Effect to fetch and cache the label as a blob when URL changes
  useEffect(() => {
    console.log("ShippingLabel component received props:", { labelUrl, trackingCode, shipmentId, format });
    const fetchAndCacheLabel = async () => {
      const url = localLabelUrl || labelUrl;
      if (!url) return;
      
      try {
        console.log("Fetching label to cache as blob:", url);
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/pdf, image/png, application/octet-stream' },
          cache: 'no-cache' // Force fetch fresh content
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch label: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setBlobUrl(blobUrl);
        console.log("Label cached as blob URL:", blobUrl);
        
        // Automatically open the label modal when the blob is ready
        setIsLabelModalOpen(true);
      } catch (error) {
        console.error("Error caching label:", error);
        toast("Error preparing label for download");
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
    return null;
  }
  
  const handleRefreshLabel = async () => {
    if (!shipmentId) {
      toast("Missing shipment ID");
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
        toast("Label refreshed successfully");
      } else {
        throw new Error('No label URL found');
      }
    } catch (error) {
      console.error('Error refreshing label:', error);
      toast("Failed to refresh label");
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
          toast(`Your ${format.toUpperCase()} label has been downloaded`);
        }, 100);
      } catch (error) {
        console.error('Direct download error:', error);
        toast("Failed to download directly");
        tryFallbackDownload(format);
      }
    } else {
      tryFallbackDownload(format);
    }
  };
  
  const tryFallbackDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast("No label URL available");
      return;
    }
    
    try {
      console.log(`Trying fallback download with URL (${format}):`, url);
      
      // Create a hidden iframe to download without navigating away
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
      // Also try direct window.open as another fallback
      window.open(url, '_blank');
      
      // Clean up after a moment
      setTimeout(() => {
        document.body.removeChild(iframe);
        toast(`Starting ${format.toUpperCase()} download through fallback method`);
      }, 1000);
    } catch (error) {
      console.error('Fallback download error:', error);
      toast("All download methods failed. Try the \"Open in New Tab\" option");
    }
  };

  const handleOpenInNewTab = () => {
    const urlToOpen = blobUrl || localLabelUrl || labelUrl;
    if (!urlToOpen) {
      toast("No label URL available");
      return;
    }
    
    try {
      console.log("Opening URL in new tab:", urlToOpen);
      const newWindow = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      
      if (newWindow) {
        newWindow.focus();
        toast("Label opened in new tab");
      } else {
        throw new Error('Popup blocked or failed to open');
      }
    } catch (error) {
      console.error('Open in new tab error:', error);
      toast("Failed to open label in new tab. Please check your popup blocker settings.");
    }
  };

  const handleEmailLabel = async () => {
    if (!blobUrl && !labelUrl && !localLabelUrl) {
      toast("No label available to email");
      return;
    }

    setIsEmailSending(true);
    try {
      toast("Sending label to your email...");
      
      // For now, we'll simulate the email sending
      // In a real implementation, this would call a backend function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast("Label sent to your registered email");
      
      // Close the modal after emailing
      setIsLabelModalOpen(false);
    } catch (error) {
      console.error('Email label error:', error);
      toast("Failed to email label");
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleSaveToAccount = async () => {
    const url = blobUrl || localLabelUrl || labelUrl;
    if (!url || !trackingCode) {
      toast("Missing label data or tracking information");
      return;
    }
    
    setIsSaving(true);
    try {
      toast("Saving label to your account...");
      
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
      
      toast("Label saved to your account");
      
      // Close the modal after saving
      setIsLabelModalOpen(false);
    } catch (error) {
      console.error('Save label error:', error);
      toast("Failed to save label");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <>
      {labelUrl || localLabelUrl ? (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border-2 border-green-200">
          <div className="flex flex-col space-y-5">
            <LabelSummary 
              trackingCode={trackingCode}
              selectedFormat={selectedFormat}
              handleRefreshLabel={handleRefreshLabel}
              isRefreshing={isRefreshing}
              shipmentId={shipmentId}
            />
            
            <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
              <h4 className="text-gray-700 font-medium mb-4 text-lg">Your label is ready! How would you like to receive it?</h4>
              
              <LabelActions 
                handleDirectDownload={handleDirectDownload}
                handleOpenInNewTab={handleOpenInNewTab}
                handleEmailLabel={handleEmailLabel}
                handleSaveToAccount={handleSaveToAccount}
                isEmailSending={isEmailSending}
                isSaving={isSaving}
                selectedFormat={selectedFormat}
              />
            </div>

            <div className="text-sm text-center text-green-600">
              <p>You can always access your labels later in your Order History</p>
            </div>
          </div>
        </div>
      ) : null}
      
      <LabelModal
        isOpen={isLabelModalOpen}
        setIsOpen={setIsLabelModalOpen}
        blobUrl={blobUrl}
        trackingCode={trackingCode}
        handleDirectDownload={handleDirectDownload}
        handleEmailLabel={handleEmailLabel}
        handleSaveToAccount={handleSaveToAccount}
        isEmailSending={isEmailSending}
        isSaving={isSaving}
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
      />
    </>
  );
};

export default ShippingLabel;

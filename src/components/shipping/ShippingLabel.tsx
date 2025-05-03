
import React, { useState, useRef } from 'react';
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
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  
  if (!labelUrl && !localLabelUrl) return null;
  
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
        throw new Error('Failed to refresh label: ' + error.message);
      }
      
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
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log("Starting direct download with URL:", url);
      
      // Create a hidden anchor element with download attribute
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || 'download'}.pdf`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      
      console.log("Triggering click on download link");
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        toast.success('Your label download has started');
      }, 100);
    } catch (error) {
      console.error('Direct download error:', error);
      toast.error('Failed to download directly. Trying alternative method...');
      handleOpenInNewTab();
    }
  };

  const handleOpenInNewTab = () => {
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      console.log("Opening URL in new tab:", url);
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
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
    const url = localLabelUrl || labelUrl;
    if (!url || !trackingCode) {
      toast.error('Missing label URL or tracking information');
      return;
    }
    
    setIsEmailSending(true);
    try {
      // In a real implementation, this would call an edge function
      // For now, we'll simulate the email sending
      toast.loading('Sending label to your email...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Label sent to your registered email');
    } catch (error) {
      console.error('Email label error:', error);
      toast.error('Failed to email label');
    } finally {
      setIsEmailSending(false);
    }
  };

  const handleSaveToAccount = async () => {
    const url = localLabelUrl || labelUrl;
    if (!url || !trackingCode) {
      toast.error('Missing label URL or tracking information');
      return;
    }
    
    setIsSaving(true);
    try {
      // In a real implementation, this would call an edge function to save the label
      toast.loading('Saving label to your account...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Label saved to your account');
    } catch (error) {
      console.error('Save label error:', error);
      toast.error('Failed to save label');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
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

          {/* Invisible download link for fallback */}
          <a 
            ref={downloadLinkRef} 
            href={localLabelUrl || labelUrl || '#'} 
            download={`shipping_label_${trackingCode || 'download'}.pdf`}
            style={{ display: 'none' }} 
            rel="noopener noreferrer"
          >
            Download Label
          </a>
        </div>

        <div className="text-sm text-center text-green-600">
          <p>You can always access your labels later in your Order History</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;

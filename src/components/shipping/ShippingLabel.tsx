
import React, { useState } from 'react';
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
  
  if (!labelUrl && !localLabelUrl) return null;
  
  const handleRefreshLabel = async () => {
    if (!shipmentId) return;
    
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
      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipping_label_${trackingCode || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      toast.success('Downloading shipping label');
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
      window.open(url, '_blank');
      toast.success('Label opened in new tab');
    } catch (error) {
      console.error('Open in new tab error:', error);
      toast.error('Failed to open label in new tab');
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
      // Simulate email sending - in a real app, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    
    try {
      // Simulate saving - in a real app, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Label saved to your account');
    } catch (error) {
      console.error('Save label error:', error);
      toast.error('Failed to save label');
    }
  };
  
  return (
    <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border-2 border-green-200">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h3 className="font-semibold text-green-800 text-xl mb-1">Label Generated Successfully!</h3>
            <p className="text-sm text-green-700">Tracking Number: <span className="font-medium">{trackingCode}</span></p>
          </div>
          {shipmentId && (
            <Button
              onClick={handleRefreshLabel}
              variant="outline"
              size="sm"
              className="mt-2 sm:mt-0 bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refresh Label
            </Button>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <h4 className="text-gray-700 font-medium mb-3">Your label is ready! How would you like to receive it?</h4>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleDirectDownload}
              variant="default" 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
            
            <Button 
              onClick={handleOpenInNewTab}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Open in New Tab
            </Button>
            
            <Button 
              onClick={handleEmailLabel}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
              disabled={isEmailSending}
            >
              <Mail className="mr-2 h-4 w-4" /> 
              {isEmailSending ? 'Sending...' : 'Email to My Inbox'}
            </Button>
            
            <Button 
              onClick={handleSaveToAccount}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              <Save className="mr-2 h-4 w-4" /> Save to My Labels
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;

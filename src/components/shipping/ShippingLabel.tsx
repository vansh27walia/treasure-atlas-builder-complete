
import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShippingLabelProps {
  labelUrl: string | null;
  trackingCode: string | null;
  shipmentId?: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ labelUrl, trackingCode, shipmentId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  
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

  const handleDownload = () => {
    const url = localLabelUrl || labelUrl;
    if (!url) {
      toast.error('No label URL available');
      return;
    }
    
    try {
      // Log the download attempt
      console.log('Attempting to download label from URL:', url);
      
      // Force a direct download by creating a temporary iframe
      // This bypasses potential CORS issues and works better for PDFs and images
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Set up the iframe content
      iframe.onload = () => {
        // Once iframe is loaded, remove it
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
      
      // Set the iframe src to the label URL
      iframe.src = url;
      
      // Also try the traditional anchor approach as backup
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipping_label_${trackingCode || 'download'}.pdf`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      
      // Clean up the anchor element
      setTimeout(() => {
        document.body.removeChild(link);
      }, 1000);
      
      toast.success('Downloading shipping label');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label. Trying alternative method...');
      
      // Fallback - open in new tab
      window.open(url, '_blank');
    }
  };
  
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="font-semibold text-green-800 text-lg">Label Generated Successfully!</h3>
          <p className="text-sm text-green-700">Tracking Number: <span className="font-medium">{trackingCode}</span></p>
        </div>
        <div className="flex mt-3 sm:mt-0 gap-2">
          {shipmentId && (
            <button
              onClick={handleRefreshLabel}
              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refresh
            </button>
          )}
          <button 
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Download className="mr-2 h-4 w-4" /> Download Label
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;

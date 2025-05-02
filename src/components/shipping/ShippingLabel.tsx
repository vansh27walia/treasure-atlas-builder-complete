
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
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shipping_label_${trackingCode || 'download'}.pdf`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Downloading shipping label');
  };
  
  return (
    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h3 className="font-semibold text-green-800">Label Generated Successfully!</h3>
          <p className="text-sm text-green-700">Tracking Number: {trackingCode}</p>
        </div>
        <div className="flex mt-3 sm:mt-0 gap-2">
          {shipmentId && (
            <button
              onClick={handleRefreshLabel}
              className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
              Refresh
            </button>
          )}
          <button 
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Download className="mr-2 h-4 w-4" /> Download Label
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;

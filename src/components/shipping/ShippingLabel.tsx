
import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShippingLabelProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentId?: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ labelUrl, trackingCode, shipmentId }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  if (!labelUrl) return null;
  
  const handleRefreshLabel = async () => {
    if (!shipmentId) return;
    
    setIsRefreshing(true);
    
    try {
      const response = await fetch(`/api/get-stored-label?shipment_id=${shipmentId}`);
      if (!response.ok) {
        throw new Error('Failed to refresh label');
      }
      
      const data = await response.json();
      if (data.labelUrl) {
        // We'd use this data to update the URL in the parent component
        // For now, just notify the user
        toast.success('Label refreshed successfully');
        
        // In a real implementation, we'd update the URL:
        // updateLabelUrl(data.labelUrl);
        window.open(data.labelUrl, '_blank');
      }
    } catch (error) {
      console.error('Error refreshing label:', error);
      toast.error('Failed to refresh label');
    } finally {
      setIsRefreshing(false);
    }
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
          <a 
            href={labelUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Download className="mr-2 h-4 w-4" /> Download Label
          </a>
        </div>
      </div>
    </div>
  );
};

export default ShippingLabel;

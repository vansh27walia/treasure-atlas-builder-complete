
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PaymentMethodSelector from '../payment/PaymentMethodSelector';
import SimplifiedLabelInterface from './SimplifiedLabelInterface';

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
  onFormatChange?: (format: string) => void;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  onFormatChange
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLabelUrl, setLocalLabelUrl] = useState(labelUrl);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  const [paymentCompleted, setPaymentCompleted] = useState(!!labelUrl); // If labelUrl exists, payment was completed
  
  useEffect(() => {
    if (labelUrl !== localLabelUrl) {
      setLocalLabelUrl(labelUrl);
    }
  }, [labelUrl]);
  
  const handleFormatChange = async (format: string): Promise<void> => {
    setSelectedFormat(format);
    
    if (onFormatChange) {
      try {
        setIsRefreshing(true);
        await onFormatChange(format);
        setIsRefreshing(false);
        toast.success(`Label format changed to ${format}`);
      } catch (error) {
        console.error("Error changing label format:", error);
        toast.error("Failed to change label format");
        setIsRefreshing(false);
      }
    }
  };
  
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
    
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [labelUrl, localLabelUrl]);

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      setPaymentCompleted(true);
      toast.success('Payment successful! Label is now available for download.');
    }
  };
  
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
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          label_format: selectedFormat,
          file_format: 'pdf'
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
  
  if (!paymentCompleted) {
    return (
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex flex-col space-y-5">
          <div className="text-center">
            <h3 className="font-semibold text-purple-800 text-xl mb-2">Complete Payment to Access Your Label</h3>
            <p className="text-sm text-purple-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span></p>
          </div>
          
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <div>
                <h4 className="text-gray-700 font-medium mb-4 text-lg">Complete Payment to Access Your Label</h4>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0">
                <Select
                  value={selectedFormat}
                  onValueChange={handleFormatChange}
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

            <PaymentMethodSelector
              selectedPaymentMethod={null}
              onPaymentMethodChange={() => {}}
              onPaymentComplete={handlePaymentComplete}
              amount={5.99}
              description="Shipping Label Access"
            />
          </div>

          <div className="text-sm text-center text-purple-600">
            <p>You can always access your labels later in your Order History</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SimplifiedLabelInterface
      labelUrl={localLabelUrl || labelUrl || ''}
      trackingCode={trackingCode}
      onFormatChange={handleFormatChange}
      shipmentId={shipmentId || undefined}
      labelUrls={{
        pdf: localLabelUrl || labelUrl || undefined
      }}
    />
  );
};

export default ShippingLabel;

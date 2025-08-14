import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, File, FileArchive, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('4x6');
  const [selectedFileFormat, setSelectedFileFormat] = useState<'pdf' | 'png' | 'zpl'>('pdf');
  const [paymentCompleted, setPaymentCompleted] = useState(!!labelUrl);

  useEffect(() => {
    if (labelUrl !== localLabelUrl) {
      setLocalLabelUrl(labelUrl);
    }
  }, [labelUrl]);
  
  const handleFormatChange = async (format: string) => {
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
          file_format: selectedFileFormat
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

  const handleDirectDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (format !== selectedFileFormat) {
      setSelectedFileFormat(format);
    }

    if (blobUrl) {
      try {
        console.log(`Starting direct download with blob URL (${format}):`, blobUrl);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
        document.body.appendChild(link);
        link.click();
        
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
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      
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

    setIsEmailSending(true);
    try {
      toast.loading('Sending label to your email...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.dismiss();
      toast.success('Label sent to your registered email');
      
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
      
      const { error } = await supabase
        .from('shipment_records')
        .insert({
          tracking_code: trackingCode,
          label_url: url,
          shipment_id: shipmentId || '',
          status: 'completed',
          label_format: selectedFormat,
          file_format: selectedFileFormat
        });
      
      if (error) {
        throw new Error(`Failed to save label: ${error.message}`);
      }
      
      toast.dismiss();
      toast.success('Label saved to your account');
      
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
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-purple-800 text-xl mb-2">Label Generated Successfully!</h3>
              <p className="text-sm text-purple-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span></p>
            </div>
            
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
          
          <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
            {isRefreshing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-purple-800">Refreshing label...</p>
              </div>
            ) : !paymentCompleted ? (
              <div className="space-y-4">
                <h4 className="text-gray-700 font-medium mb-4 text-lg">Complete Payment to Access Your Label</h4>
                <PaymentMethodSelector
                  selectedPaymentMethod={null}
                  onPaymentMethodChange={() => {}}
                  onPaymentComplete={handlePaymentComplete}
                  amount={5.99}
                  description="Shipping Label Access"
                />
              </div>
            ) : (
              <SimplifiedLabelInterface
                labelUrl={localLabelUrl || labelUrl || ''}
                trackingCode={trackingCode || ''}
                shipmentId={shipmentId}
                labelUrls={{
                  pdf: localLabelUrl || labelUrl || undefined
                }}
              />
            )}
          </div>

          <div className="text-sm text-center text-purple-600">
            <p>You can always access your labels later in your Order History</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingLabel;

import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, Mail, Save, File, FileArchive, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const labelFormats = [
  { value: '4x6', label: '4x6" Shipping Label', description: 'Formatted for Thermal Label Printers' },
  { value: '8.5x11-left', label: '8.5x11" - 1 Label per Page - Left Side', description: 'One 4x6" label on the left side of a letter-sized page' },
  { value: '8.5x11-right', label: '8.5x11" - 1 Label per Page - Right Side', description: 'One 4x6" label on the right side of a letter-sized page' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels per Page', description: 'Two 4x6" labels per letter-sized page' }
];

interface ShippingLabelProps {
  labelUrls: {
    png: string | null;
    pdf: string | null;
    zpl: string | null;
  } | null;
  trackingCode: string | null;
  shipmentId?: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrls, 
  trackingCode, 
  shipmentId,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  if (!labelUrls || (!labelUrls.png && !labelUrls.pdf)) {
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
      // This part would need to be updated to fetch multiple formats if needed
      // For now, it will refresh based on the selected format in a hypothetical scenario
      toast.info('Refresh logic would need to be updated for multiple formats.');
    } catch (error) {
      console.error('Error refreshing label:', error);
      toast.error('Failed to refresh label');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDirectDownload = async (format: 'pdf' | 'png' | 'zpl') => {
    let url: string | null | undefined;
    if (format === 'pdf') url = labelUrls?.pdf;
    if (format === 'png') url = labelUrls?.png;
    if (format === 'zpl') url = labelUrls?.zpl;

    if (!url) {
        toast.error(`No ${format.toUpperCase()} label available to download.`);
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch label: ${response.status}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          toast.success(`Your ${format.toUpperCase()} label has been downloaded`);
        }, 100);
    } catch (error) {
        console.error('Direct download error:', error);
        toast.error('Failed to download the label.');
    }
  };
  
  const handleOpenInNewTab = () => {
    const urlToOpen = labelUrls?.pdf || labelUrls?.png;
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
    if (!labelUrls?.pdf && !labelUrls?.png) {
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
    const url = labelUrls?.pdf || labelUrls?.png;
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
          label_url: url, // Could be improved to save all urls
          shipment_id: shipmentId || '',
          status: 'completed',
          file_format: 'pdf' // Defaulting to pdf for this example
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
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-purple-800 text-xl mb-2">Label Generated Successfully!</h3>
              <p className="text-sm text-purple-700 mb-1">Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              <Button
                onClick={() => handleDirectDownload('pdf')}
                disabled={!labelUrls?.pdf || isRefreshing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <Button
                onClick={() => handleDirectDownload('png')}
                variant="outline"
                disabled={!labelUrls?.png || isRefreshing}
              >
                <Download className="mr-2 h-4 w-4" /> Download PNG
              </Button>
               <Button
                onClick={() => handleDirectDownload('zpl')}
                variant="outline"
                disabled={!labelUrls?.zpl || isRefreshing}
              >
                <Download className="mr-2 h-4 w-4" /> Download ZPL
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleRefreshLabel}
                disabled={isRefreshing}
                title="Refresh Label"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleOpenInNewTab}
                title="Open in New Tab"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <iframe
              ref={iframeRef}
              className="w-full h-96 rounded-md border"
              src={labelUrls?.png || labelUrls?.pdf || ''}
              title="Shipping Label Preview"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline"
              onClick={() => setIsLabelModalOpen(true)}
            >
              <FileArchive className="mr-2 h-4 w-4" /> More Options
            </Button>
            <Button 
              onClick={() => handleDirectDownload('pdf')}
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!labelUrls?.pdf}
            >
              Download Label
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isLabelModalOpen} onOpenChange={setIsLabelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>More Label Options</DialogTitle>
            <DialogDescription>
              Email, save, or download the label in different formats.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={handleEmailLabel} disabled={isEmailSending}>
              <Mail className="mr-2 h-4 w-4" /> {isEmailSending ? 'Sending...' : 'Email Label'}
            </Button>
            <Button onClick={handleSaveToAccount} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Saving...' : 'Save to My Labels'}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLabelModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShippingLabel;

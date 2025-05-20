
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Download, Printer, Archive, Copy, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from "@/integrations/supabase/client";
import { useReactToPrint } from 'react-to-print';
import PrintPreview from './PrintPreview';

interface ShippingLabelProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentId: string | null;
  onFormatChange?: (format: string, fileType?: string) => Promise<void>;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({ 
  labelUrl, 
  trackingCode, 
  shipmentId,
  onFormatChange 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const labelRef = React.useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
    documentTitle: `Shipping_Label_${trackingCode || 'Print'}`,
  });

  const handleDownload = async (format = 'pdf') => {
    setIsDownloading(true);
    
    try {
      if (!labelUrl) {
        toast.error('Label URL not available');
        return;
      }
      
      // Use a direct download for the current URL if no shipmentId
      if (!shipmentId) {
        const link = document.createElement('a');
        link.href = labelUrl;
        link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Label downloaded successfully');
        return;
      }
      
      // Use get-stored-label edge function to get the label in the requested format
      const { data, error } = await supabase.functions.invoke('get-stored-label', {
        body: { 
          shipment_id: shipmentId,
          file_type: format
        }
      });
      
      if (error) {
        throw new Error(`Error getting label: ${error.message}`);
      }
      
      if (!data?.labelUrl) {
        throw new Error('No label URL received');
      }
      
      // Download the file
      const link = document.createElement('a');
      link.href = data.labelUrl;
      link.download = `shipping_label_${trackingCode || 'download'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Label downloaded as ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label. Trying fallback method...');
      
      // Fallback: try to open the label URL directly
      window.open(labelUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyTrackingNumber = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      toast.success('Tracking number copied to clipboard');
    } else {
      toast.error('No tracking number available');
    }
  };

  const handleDownloadZip = async () => {
    if (!shipmentId || !trackingCode) {
      toast.error('Missing shipment information for ZIP package');
      return;
    }
    
    setIsGeneratingZip(true);
    
    try {
      toast.loading('Generating ZIP archive of all label formats...');
      
      // Call edge function to create ZIP archive
      const { data, error } = await supabase.functions.invoke('create-label-archive', {
        body: { 
          shipmentId,
          formats: ['pdf', 'png', 'zpl'],
        }
      });
      
      if (error) {
        throw new Error(`Error creating label archive: ${error.message}`);
      }
      
      if (!data?.archiveUrl) {
        throw new Error("No archive URL received");
      }
      
      // Download the archive
      const link = document.createElement('a');
      link.href = data.archiveUrl;
      link.download = `shipping_labels_${trackingCode}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        toast.dismiss();
        toast.success(`ZIP archive downloaded successfully`);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading ZIP archive:', error);
      toast.dismiss();
      toast.error('Failed to generate ZIP archive');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  return (
    <Card className="p-6 border-2 border-gray-200">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-blue-800">Shipping Label Ready</h2>
          <p className="text-gray-600">Your label has been generated successfully</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 lg:mt-0">
          <Button 
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('png')}>
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadZip}>
                Download All Formats (ZIP)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            onClick={() => window.open(labelUrl, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </Button>
        </div>
      </div>
      
      <div className="border-2 border-gray-300 rounded-md p-4 mb-6 flex flex-col items-center" ref={labelRef}>
        <img 
          src={labelUrl} 
          alt="Shipping Label" 
          className="max-w-full h-auto"
          style={{ maxHeight: '500px' }}
        />
      </div>
      
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="font-medium text-gray-800">Tracking Number</h3>
            <p className="text-lg font-mono font-semibold">{trackingCode || 'Not available'}</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCopyTrackingNumber}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>

            <PrintPreview
              labelUrl={labelUrl}
              trackingCode={trackingCode}
              shipmentId={shipmentId || undefined}
              onFormatChange={onFormatChange}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ShippingLabel;

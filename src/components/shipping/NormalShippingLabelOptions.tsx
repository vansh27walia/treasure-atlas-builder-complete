
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';
import PrintPreview from './PrintPreview';

interface NormalShippingLabelOptionsProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentId?: string;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
}

const NormalShippingLabelOptions: React.FC<NormalShippingLabelOptionsProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  shipmentDetails,
  labelUrls
}) => {
  const handleDirectDownload = async () => {
    // Use PNG URL if available, fallback to main labelUrl
    const downloadUrl = labelUrls?.png || labelUrl;
    const isImage = downloadUrl?.includes('.png') || labelUrls?.png;
    
    if (downloadUrl) {
      try {
        toast.loading('Downloading PNG label...');
        
        // Fetch the image from Supabase storage
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Content-Type': isImage ? 'image/png' : 'application/pdf'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch label: ${response.status} ${response.statusText}`);
        }
        
        // Get the blob
        const blob = await response.blob();
        
        // Create download link
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `shipping_label_${trackingCode || shipmentId || Date.now()}.${isImage ? 'png' : 'pdf'}`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
        
        toast.success(`${isImage ? 'PNG' : 'PDF'} label downloaded successfully`);
      } catch (error) {
        console.error('Error downloading label:', error);
        toast.error('Failed to download label. Please try again.');
      }
    } else {
      toast.error('Label URL not available');
    }
  };

  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [openToEmailTab, setOpenToEmailTab] = React.useState(false);

  const handleEmailLabel = () => {
    // Open the Print Preview modal with Email tab active  
    setOpenToEmailTab(true);
    setIsEmailModalOpen(true);
  };

  const handlePrintPreview = () => {
    // Open the Print Preview modal with Preview tab active
    setOpenToEmailTab(false);
    setIsEmailModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Print Preview Option - Top Priority */}
        <PrintPreview
        labelUrl={labelUrls?.png || labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        shipmentDetails={shipmentDetails}
        labelUrls={labelUrls}
        isOpenProp={isEmailModalOpen}
        onOpenChangeProp={setIsEmailModalOpen}
        openToEmailTab={openToEmailTab}
        triggerButton={
          <Button
            variant="outline"
            className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-11 font-medium"
            onClick={handlePrintPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
        }
      />

      {/* Download and Email Options - Side by Side */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={handleDirectDownload}
          className="border-blue-200 hover:bg-blue-50 text-blue-700 h-11 font-medium"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        <Button
          variant="outline"
          onClick={handleEmailLabel}
          className="border-green-200 hover:bg-green-50 text-green-700 h-11 font-medium"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>
    </div>
  );
};

export default NormalShippingLabelOptions;

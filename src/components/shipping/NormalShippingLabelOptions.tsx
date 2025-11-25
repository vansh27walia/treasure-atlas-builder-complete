
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';
import PrintPreview from './PrintPreview';
import { CancelLabelDialog } from './CancelLabelDialog';

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
}

const NormalShippingLabelOptions: React.FC<NormalShippingLabelOptionsProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  shipmentDetails
}) => {
  const convertPngToPdf = async (imageUrl: string): Promise<Blob> => {
    const { PDFDocument } = await import('pdf-lib');
    
    // Fetch the PNG image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const imageBytes = await response.arrayBuffer();
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed the PNG image
    const pngImage = await pdfDoc.embedPng(imageBytes);
    
    // Get image dimensions
    const { width, height } = pngImage.scale(1);
    
    // Create a page with the same dimensions as the image
    const page = pdfDoc.addPage([width, height]);
    
    // Draw the image on the page
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const handleDirectDownload = async () => {
    if (labelUrl) {
      try {
        toast.loading('Converting and downloading PDF label...');
        
        let blob: Blob;
        
        if (labelUrl.toLowerCase().includes('.png')) {
          // Convert PNG to PDF
          blob = await convertPngToPdf(labelUrl);
        } else {
          // Direct download for PDF
          const response = await fetch(labelUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/pdf'
            }
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
          }
          
          blob = await response.blob();
        }
        
        // Create download link
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `shipping_label_${trackingCode || shipmentId || Date.now()}.pdf`;
        link.style.display = 'none';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
        
        toast.success('PDF label downloaded successfully');
      } catch (error) {
        console.error('Error downloading PDF:', error);
        toast.error('Failed to convert and download PDF. Please try again.');
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
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        shipmentDetails={shipmentDetails}
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

      {/* Cancel Label Option */}
      {shipmentId && shipmentDetails && (
        <CancelLabelDialog
          shipmentId={shipmentId}
          trackingCode={trackingCode || ''}
          carrier={shipmentDetails.carrier}
          service={shipmentDetails.service}
          fromAddress={shipmentDetails.fromAddress}
          toAddress={shipmentDetails.toAddress}
        />
      )}
    </div>
  );
};

export default NormalShippingLabelOptions;

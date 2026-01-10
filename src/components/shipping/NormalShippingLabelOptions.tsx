
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
}

const NormalShippingLabelOptions: React.FC<NormalShippingLabelOptionsProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  shipmentDetails
}) => {
  const convertPngTo4x6Pdf = async (imageUrl: string): Promise<Blob> => {
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
    
    // 4x6 inches in PDF points (72 points per inch)
    const labelWidth = 288;  // 4 inches
    const labelHeight = 432; // 6 inches
    
    // Create a page with 4x6 dimensions
    const page = pdfDoc.addPage([labelWidth, labelHeight]);
    
    // Get the original image dimensions to scale properly
    const { width: imgWidth, height: imgHeight } = pngImage.scale(1);
    const scaleX = labelWidth / imgWidth;
    const scaleY = labelHeight / imgHeight;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    // Center the image on the page
    const x = (labelWidth - scaledWidth) / 2;
    const y = (labelHeight - scaledHeight) / 2;
    
    // Draw the image on the page
    page.drawImage(pngImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  const handleDirectDownload = async () => {
    if (!labelUrl) {
      toast.error('Label URL not available');
      return;
    }
    
    try {
      toast.loading('Preparing 4x6 PDF label...');
      
      let blob: Blob;
      
      // Always convert to proper 4x6 PDF format
      if (labelUrl.toLowerCase().includes('.png')) {
        // Convert PNG to 4x6 PDF
        blob = await convertPngTo4x6Pdf(labelUrl);
      } else if (labelUrl.toLowerCase().includes('.pdf')) {
        // For PDF, fetch and return as-is (already 4x6 from backend)
        const response = await fetch(labelUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        blob = await response.blob();
      } else {
        // Try to fetch and convert as PNG
        blob = await convertPngTo4x6Pdf(labelUrl);
      }
      
      // Create download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `shipping_label_4x6_${trackingCode || shipmentId || Date.now()}.pdf`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
      toast.dismiss();
      toast.success('4x6 PDF label downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.dismiss();
      toast.error('Failed to download PDF. Please try again.');
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
    </div>
  );
};

export default NormalShippingLabelOptions;

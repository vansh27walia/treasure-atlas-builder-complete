
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Printer } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShippingLabelProps {
  labelUrl: string;
  trackingCode?: string | null;
  shipmentId?: string | null;
}

const ShippingLabel: React.FC<ShippingLabelProps> = ({
  labelUrl,
  trackingCode,
  shipmentId
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfObject, setPdfObject] = useState<string | null>(null);

  useEffect(() => {
    // Create PDF object URL for embedding
    if (labelUrl) {
      setPdfObject(labelUrl);
    }
  }, [labelUrl]);

  // Handle printing
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Open the PDF in a new window and print it
      const printWindow = window.open(labelUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          try {
            printWindow.print();
            toast.success('Print dialog opened');
          } catch (error) {
            console.error('Error initiating print:', error);
            toast.error('Failed to open print dialog');
          }
        });
      } else {
        toast.error('Failed to open print window - check your pop-up blocker settings');
      }
    } catch (error) {
      console.error('Error printing label:', error);
      toast.error('Failed to print label');
    } finally {
      setIsPrinting(false);
    }
  };

  // Handle downloading
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a link and click it to trigger download
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `shipping_label_${trackingCode || 'download'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloading label...');
    } catch (error) {
      console.error('Error downloading label:', error);
      toast.error('Failed to download label');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!labelUrl) {
    return (
      <Card className="p-4 bg-red-50 text-red-700 border-red-200 text-center">
        No shipping label available
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 justify-center">
        <Button 
          onClick={handlePrint}
          disabled={isPrinting || !labelUrl}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? 'Printing...' : 'Print Label'}
        </Button>
        <Button 
          onClick={handleDownload}
          disabled={isDownloading || !labelUrl}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Downloading...' : 'Download Label'}
        </Button>
      </div>

      {/* PDF Preview */}
      <Card className="border overflow-hidden h-96 w-full">
        {pdfObject ? (
          <iframe 
            title="Shipping Label Preview"
            src={`${pdfObject}#toolbar=0&view=FitH`} 
            className="w-full h-full"
            frameBorder="0"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            Loading label preview...
          </div>
        )}
      </Card>

      {trackingCode && (
        <div className="text-center">
          <p className="text-sm text-gray-600">Tracking Number:</p>
          <p className="font-mono text-lg font-semibold">{trackingCode}</p>
        </div>
      )}
    </div>
  );
};

export default ShippingLabel;

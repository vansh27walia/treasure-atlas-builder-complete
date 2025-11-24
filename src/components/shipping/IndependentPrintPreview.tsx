import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Printer, Download, Eye, Mail, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ConsolidatedLabelUrls } from '@/types/shipping';
import { CancelLabelDialog } from './CancelLabelDialog';

const labelFormats = [
  { value: '4x6', label: '4x6" Thermal Printer' },
  { value: '8.5x11-2up', label: '8.5x11" - 2 Labels' },
  { value: '8.5x11-top', label: '8.5x11" - Single (Top)' },
  { value: '8.5x11-bottom', label: '8.5x11" - Single (Bottom)' }
];

interface IndependentPrintPreviewProps {
  batchResult?: {
    batchId: string;
    consolidatedLabelUrls: ConsolidatedLabelUrls;
    scanFormUrl: string | null;
    shipments?: Array<{
      shipmentId: string;
      trackingCode: string;
      carrier: string;
      service?: string;
      fromAddress: string;
      toAddress: string;
    }>;
  };
  triggerButton?: React.ReactNode;
  onDownloadComplete?: () => void;
}

const IndependentPrintPreview: React.FC<IndependentPrintPreviewProps> = ({
  batchResult,
  triggerButton,
  onDownloadComplete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('8.5x11-2up');
  const [isDownloading, setIsDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = async (format: 'pdf' | 'zpl' | 'epl' = 'pdf') => {
    if (!batchResult?.consolidatedLabelUrls) {
      toast.error('No batch labels available for download');
      return;
    }

    setIsDownloading(true);
    try {
      const url = batchResult.consolidatedLabelUrls[format];
      if (!url) {
        toast.error(`${format.toUpperCase()} format not available`);
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${batchResult.batchId}.${format}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} batch labels downloaded successfully`);
      onDownloadComplete?.();
    } catch (error) {
      console.error('Error downloading batch labels:', error);
      toast.error('Failed to download batch labels');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.print();
        toast.success('Print dialog opened');
      } catch (error) {
        console.error('Print error:', error);
        toast.error('Failed to open print dialog');
      }
    }
  };

  const handleEmail = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('email-labels', {
        body: {
          batchResult,
          selectedFormats: ['pdf']
        }
      });

      if (error) throw error;
      
      toast.success('Email sent successfully');
      setIsOpen(false);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700">
      <Eye className="h-4 w-4 mr-2" />
      Print Preview All Labels
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle>Batch Label Preview - ID: {batchResult?.batchId || 'N/A'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Format Selection */}
          <div className="flex items-center gap-4 px-2">
            <label className="text-sm font-medium">Format:</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {labelFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PDF Preview */}
          {batchResult?.consolidatedLabelUrls?.pdf && (
            <div className="border rounded-lg overflow-hidden bg-gray-50 mx-2">
              <iframe
                ref={iframeRef}
                src={batchResult.consolidatedLabelUrls.pdf}
                className="w-full min-h-[500px]"
                title="Batch Label Preview"
                onLoad={() => console.log('PDF preview loaded')}
              />
            </div>
          )}
        </div>

        {/* Action Buttons - Always Visible at Bottom */}
        <div className="flex-shrink-0 border-t pt-4 bg-white">
          <div className="flex justify-between items-center px-2">
            <div className="flex gap-2">
              <Button
                onClick={() => handleDownload('pdf')}
                disabled={isDownloading || !batchResult?.consolidatedLabelUrls?.pdf}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              
              <Button
                onClick={() => handleDownload('zpl')}
                disabled={isDownloading || !batchResult?.consolidatedLabelUrls?.zpl}
                variant="outline"
              >
                Download ZPL
              </Button>
              
              <Button
                onClick={() => handleDownload('epl')}
                disabled={isDownloading || !batchResult?.consolidatedLabelUrls?.epl}
                variant="outline"
              >
                Download EPL
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                disabled={!batchResult?.consolidatedLabelUrls?.pdf}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              
              <Button
                onClick={handleEmail}
                variant="outline"
                disabled={!batchResult?.consolidatedLabelUrls?.pdf}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>

              {/* Cancel Label for Batch - Shows first shipment or modal for multiple */}
              {batchResult?.shipments && batchResult.shipments.length > 0 && (
                <CancelLabelDialog
                  shipmentId={batchResult.shipments[0].shipmentId}
                  trackingCode={batchResult.shipments[0].trackingCode}
                  carrier={batchResult.shipments[0].carrier}
                  service={batchResult.shipments[0].service || ''}
                  fromAddress={batchResult.shipments[0].fromAddress}
                  toAddress={batchResult.shipments[0].toAddress}
                  onSuccess={() => {
                    toast.success('Batch label cancelled');
                    setIsOpen(false);
                  }}
                  trigger={
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Label
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndependentPrintPreview;
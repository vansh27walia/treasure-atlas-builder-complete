
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, PrinterIcon, Mail, Eye, FileText, FileImage, Archive } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from './PrintPreview';

interface LabelActionsProps {
  labelUrl: string;
  trackingCode: string;
  shipmentId: string;
  customerEmail?: string;
  onDownload?: () => void;
}

const LabelActions: React.FC<LabelActionsProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  customerEmail,
  onDownload
}) => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleDownload = (format: 'pdf' | 'png' | 'zpl') => {
    try {
      const link = document.createElement('a');
      link.href = labelUrl;
      link.download = `label_${trackingCode}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} label downloaded`);
      onDownload?.();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download label');
    }
  };

  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  const handleSendEmail = async () => {
    if (!customerEmail) {
      toast.error('No customer email available');
      return;
    }

    setIsEmailSending(true);
    try {
      // TODO: Implement email sending functionality
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Label sent to ${customerEmail}`);
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send email');
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => handleDownload('pdf')}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <FileText className="mr-1 h-4 w-4" />
          PDF
        </Button>
        
        <Button
          onClick={() => handleDownload('png')}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <FileImage className="mr-1 h-4 w-4" />
          PNG
        </Button>
        
        <Button
          onClick={() => handleDownload('zpl')}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Archive className="mr-1 h-4 w-4" />
          ZPL
        </Button>
        
        <Button
          onClick={handlePrintPreview}
          size="sm"
          variant="outline"
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
        >
          <PrinterIcon className="mr-1 h-4 w-4" />
          Print Preview
        </Button>
        
        {customerEmail && (
          <Button
            onClick={handleSendEmail}
            size="sm"
            variant="outline"
            disabled={isEmailSending}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Mail className="mr-1 h-4 w-4" />
            {isEmailSending ? 'Sending...' : 'Email'}
          </Button>
        )}
      </div>

      <PrintPreview
        isOpenProp={isPrintPreviewOpen}
        onOpenChangeProp={setIsPrintPreviewOpen}
        labelUrl={labelUrl}
        trackingCode={trackingCode}
      />
    </>
  );
};

export default LabelActions;

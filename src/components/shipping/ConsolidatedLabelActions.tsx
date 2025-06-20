
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, PrinterIcon, Mail, FileText, FileImage, Archive, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import PrintPreview from './PrintPreview';

interface ConsolidatedLabelActionsProps {
  batchId: string;
  consolidatedUrls: {
    pdf?: string;
    png?: string;
    zpl?: string;
    epl?: string;
  };
  totalLabels: number;
  onDownload?: (format: string) => void;
  onEmailAll?: () => void;
}

const ConsolidatedLabelActions: React.FC<ConsolidatedLabelActionsProps> = ({
  batchId,
  consolidatedUrls,
  totalLabels,
  onDownload,
  onEmailAll
}) => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleDownload = (format: string) => {
    const url = consolidatedUrls[format as keyof typeof consolidatedUrls];
    if (!url) {
      toast.error(`${format.toUpperCase()} file not available`);
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch_labels_${batchId}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} batch downloaded`);
      onDownload?.(format);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download batch');
    }
  };

  const handlePrintAll = () => {
    if (consolidatedUrls.pdf) {
      setIsPrintPreviewOpen(true);
    } else {
      toast.error('PDF not available for printing');
    }
  };

  const handleEmailAll = async () => {
    setIsEmailSending(true);
    try {
      await onEmailAll?.();
      toast.success('Batch labels sent to email');
    } catch (error) {
      console.error('Email error:', error);
      toast.error('Failed to send batch email');
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <>
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Package className="mr-2 h-5 w-5" />
            Consolidated Label Downloads ({totalLabels} labels)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            {consolidatedUrls.pdf && (
              <Button
                onClick={() => handleDownload('pdf')}
                className="bg-red-600 hover:bg-red-700 text-white h-16 flex-col"
              >
                <FileText className="mb-1 h-5 w-5" />
                <span className="text-sm font-semibold">PDF</span>
                <span className="text-xs opacity-90">All Labels</span>
              </Button>
            )}
            
            {consolidatedUrls.png && (
              <Button
                onClick={() => handleDownload('png')}
                className="bg-green-600 hover:bg-green-700 text-white h-16 flex-col"
              >
                <FileImage className="mb-1 h-5 w-5" />
                <span className="text-sm font-semibold">PNG</span>
                <span className="text-xs opacity-90">All Labels</span>
              </Button>
            )}
            
            {consolidatedUrls.zpl && (
              <Button
                onClick={() => handleDownload('zpl')}
                className="bg-blue-600 hover:bg-blue-700 text-white h-16 flex-col"
              >
                <Archive className="mb-1 h-5 w-5" />
                <span className="text-sm font-semibold">ZPL</span>
                <span className="text-xs opacity-90">All Labels</span>
              </Button>
            )}
            
            {consolidatedUrls.epl && (
              <Button
                onClick={() => handleDownload('epl')}
                className="bg-orange-600 hover:bg-orange-700 text-white h-16 flex-col"
              >
                <Archive className="mb-1 h-5 w-5" />
                <span className="text-sm font-semibold">EPL</span>
                <span className="text-xs opacity-90">All Labels</span>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePrintAll}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              <PrinterIcon className="mr-2 h-4 w-4" />
              Print All Labels
            </Button>
            
            <Button
              onClick={handleEmailAll}
              variant="outline"
              disabled={isEmailSending}
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isEmailSending ? 'Sending...' : 'Email All Labels'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {consolidatedUrls.pdf && (
        <PrintPreview
          isOpenProp={isPrintPreviewOpen}
          onOpenChangeProp={setIsPrintPreviewOpen}
          labelUrl={consolidatedUrls.pdf}
          trackingCode={null}
          isBatchPreview={true}
        />
      )}
    </>
  );
};

export default ConsolidatedLabelActions;

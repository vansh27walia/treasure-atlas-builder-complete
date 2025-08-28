
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';
import EnhancedPrintPreview from './EnhancedPrintPreview';

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
  const handleDirectDownload = () => {
    if (labelUrl) {
      // Direct download to PDF URL - opens in new tab
      window.open(labelUrl, '_blank');
      toast.success('Opening PDF label in new tab');
    } else {
      toast.error('Label URL not available');
    }
  };

  const handleEmailLabel = () => {
    // TODO: Implement email functionality - requires backend integration
    toast.info('Email functionality requires backend setup. Please contact support to enable email sending.');
  };

  return (
    <div className="flex gap-3 w-full">
      {/* Print Preview Button */}
      <EnhancedPrintPreview
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        shipmentDetails={shipmentDetails}
        triggerButton={
          <Button
            variant="outline"
            className="flex-1 border-purple-200 hover:bg-purple-50 text-purple-700 h-11 font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
        }
      />

      {/* Download Button */}
      <Button
        variant="outline"
        onClick={handleDirectDownload}
        className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-700 h-11 font-medium"
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>

      {/* Email Button */}
      <Button
        variant="outline"
        onClick={handleEmailLabel}
        className="flex-1 border-green-200 hover:bg-green-50 text-green-700 h-11 font-medium"
      >
        <Mail className="h-4 w-4 mr-2" />
        Email
      </Button>
    </div>
  );
};

export default NormalShippingLabelOptions;

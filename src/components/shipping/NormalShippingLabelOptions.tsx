
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
      // Direct download to PDF URL
      window.open(labelUrl, '_blank');
      toast.success('Opening PDF label in new tab');
    } else {
      toast.error('Label URL not available');
    }
  };

  const handleEmailLabel = () => {
    // TODO: Implement email functionality
    toast.success('Email functionality coming soon');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Print Preview Option */}
      <EnhancedPrintPreview
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        shipmentDetails={shipmentDetails}
        triggerButton={
          <Button
            variant="outline"
            className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-10"
          >
            <Eye className="h-4 w-4 mr-2" />
            Print Preview
          </Button>
        }
      />

      {/* Download Label Option - Direct to PDF URL */}
      <Button
        variant="outline"
        onClick={handleDirectDownload}
        className="w-full border-blue-200 hover:bg-blue-50 text-blue-700 h-10"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Label
      </Button>

      {/* Email Option */}
      <Button
        variant="outline"
        onClick={handleEmailLabel}
        className="w-full border-green-200 hover:bg-green-50 text-green-700 h-10"
      >
        <Mail className="h-4 w-4 mr-2" />
        Email Label
      </Button>
    </div>
  );
};

export default NormalShippingLabelOptions;

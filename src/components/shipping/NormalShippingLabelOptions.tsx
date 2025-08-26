
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
  const handleDirectDownload = () => {
    if (labelUrl) {
      window.open(labelUrl, '_blank');
      toast.success('Opening PDF label in new tab');
    } else {
      toast.error('Label URL not available');
    }
  };

  const handleEmailLabel = () => {
    toast.info('Email functionality requires backend setup. Please contact support to enable email sending.');
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Three buttons in a row: Print Preview, Email, Download */}
      <div className="grid grid-cols-3 gap-3">
        <PrintPreview
          labelUrl={labelUrl}
          trackingCode={trackingCode}
          shipmentId={shipmentId}
          shipmentDetails={shipmentDetails}
          isBatchPreview={false}
          triggerButton={
            <Button
              variant="outline"
              className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-11 font-medium text-sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Print Preview
            </Button>
          }
        />

        <Button
          variant="outline"
          onClick={handleEmailLabel}
          className="border-green-200 hover:bg-green-50 text-green-700 h-11 font-medium text-sm"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>

        <Button
          variant="outline"
          onClick={handleDirectDownload}
          className="border-blue-200 hover:bg-blue-50 text-blue-700 h-11 font-medium text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default NormalShippingLabelOptions;

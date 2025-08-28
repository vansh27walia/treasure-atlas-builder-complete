import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mail, Eye } from 'lucide-react';
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
    console.log('Direct download clicked with URL:', labelUrl);
    if (labelUrl) {
      window.open(labelUrl, '_blank');
      toast.success('Opening PDF label in new tab');
    } else {
      toast.error('Label URL not available');
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-3 gap-3">
        <PrintPreview
          labelUrl={labelUrl}
          trackingCode={trackingCode}
          shipmentId={shipmentId}
          shipmentDetails={shipmentDetails}
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

        <PrintPreview
          labelUrl={labelUrl}
          trackingCode={trackingCode}
          shipmentId={shipmentId}
          shipmentDetails={shipmentDetails}
          initialTab="email"
          triggerButton={
            <Button
              variant="outline"
              className="w-full border-green-200 hover:bg-green-50 text-green-700 h-11 font-medium text-sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          }
        />

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
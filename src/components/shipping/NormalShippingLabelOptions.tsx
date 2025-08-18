
import React, { useState } from 'react';
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
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
    <div className="w-full">
      {/* Side-by-side layout for Print Preview, Download, and Email */}
      <div className="flex gap-3 w-full">
        {/* Print Preview Button - Main action */}
        <Button
          onClick={() => setShowPrintPreview(true)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white h-12 font-semibold rounded-lg shadow-md"
        >
          <Eye className="h-4 w-4 mr-2" />
          Print Preview
        </Button>

        {/* Download Button */}
        <Button
          variant="outline"
          onClick={handleDirectDownload}
          className="flex-1 border-blue-200 hover:bg-blue-50 text-blue-700 h-12 font-medium rounded-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>

        {/* Email Button */}
        <Button
          variant="outline"
          onClick={handleEmailLabel}
          className="flex-1 border-green-200 hover:bg-green-50 text-green-700 h-12 font-medium rounded-lg"
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      {/* Enhanced Print Preview Modal */}
      <EnhancedPrintPreview
        isOpenProp={showPrintPreview}
        onOpenChangeProp={setShowPrintPreview}
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        shipmentDetails={shipmentDetails}
      />
    </div>
  );
};

export default NormalShippingLabelOptions;

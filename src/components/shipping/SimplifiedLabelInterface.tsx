
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Printer } from 'lucide-react';
import PrintPreview from './PrintPreview';

interface SimplifiedLabelInterfaceProps {
  labelUrl: string;
  trackingCode: string;
  shipmentId?: string;
  labelUrls?: {
    png?: string;
    pdf?: string;
    zpl?: string;
  };
}

const SimplifiedLabelInterface: React.FC<SimplifiedLabelInterfaceProps> = ({
  labelUrl,
  trackingCode,
  shipmentId,
  labelUrls
}) => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const handleViewLabel = () => {
    // Open label in full-screen PDF view
    if (labelUrl || labelUrls?.pdf) {
      const url = labelUrls?.pdf || labelUrl;
      window.open(url, '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
    }
  };

  const handlePrintLabel = () => {
    setIsPrintPreviewOpen(true);
  };

  return (
    <>
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Shipping Label Ready</h2>
          <p className="text-sm text-gray-600">
            Tracking: <span className="font-mono font-medium">{trackingCode}</span>
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleViewLabel}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            disabled={!labelUrl && !labelUrls?.pdf}
          >
            <Eye className="h-5 w-5 mr-2" />
            View Label
          </Button>

          <Button
            onClick={handlePrintLabel}
            variant="outline"
            className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
            disabled={!labelUrl && !labelUrls?.pdf}
          >
            <Printer className="h-5 w-5 mr-2" />
            Print Label
          </Button>
        </div>
      </div>

      <PrintPreview
        isOpenProp={isPrintPreviewOpen}
        onOpenChangeProp={setIsPrintPreviewOpen}
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentId={shipmentId}
        labelUrls={labelUrls}
        isBatchPreview={false}
      />
    </>
  );
};

export default SimplifiedLabelInterface;

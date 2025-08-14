
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Printer } from 'lucide-react';
import PrintPreview from './PrintPreview';

interface SimplifiedLabelInterfaceProps {
  labelUrl: string;
  trackingCode: string | null;
  shipmentDetails?: {
    fromAddress: string;
    toAddress: string;
    weight: string;
    dimensions?: string;
    service: string;
    carrier: string;
  };
  onFormatChange?: (format: string) => Promise<void>;
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
  shipmentDetails,
  onFormatChange,
  shipmentId,
  labelUrls
}) => {
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  const handleViewLabel = () => {
    if (labelUrl) {
      window.open(labelUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrintLabel = () => {
    setIsPrintPreviewOpen(true);
  };

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-sm border-2 border-purple-200">
      <div className="flex flex-col space-y-5">
        <div className="text-center">
          <h3 className="font-semibold text-purple-800 text-xl mb-2">Label Generated Successfully!</h3>
          <p className="text-sm text-purple-700 mb-4">
            Tracking Number: <span className="font-medium bg-white px-2 py-1 rounded border border-purple-200">{trackingCode}</span>
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-md border border-gray-200 shadow-sm">
          <h4 className="text-gray-700 font-medium mb-6 text-lg text-center">Your shipping label is ready!</h4>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button 
              onClick={handleViewLabel}
              className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex-1 font-medium"
            >
              <Eye className="mr-2 h-5 w-5" /> 
              View Label
            </Button>
            
            <Button 
              onClick={handlePrintLabel}
              className="bg-purple-600 hover:bg-purple-700 text-white h-12 flex-1 font-medium"
            >
              <Printer className="mr-2 h-5 w-5" /> 
              Print Label
            </Button>
          </div>
        </div>

        <div className="text-sm text-center text-purple-600">
          <p>You can always access your labels later in your Order History</p>
        </div>
      </div>

      <PrintPreview
        isOpenProp={isPrintPreviewOpen}
        onOpenChangeProp={setIsPrintPreviewOpen}
        labelUrl={labelUrl}
        trackingCode={trackingCode}
        shipmentDetails={shipmentDetails}
        onFormatChange={onFormatChange}
        shipmentId={shipmentId}
        labelUrls={labelUrls}
      />
    </div>
  );
};

export default SimplifiedLabelInterface;

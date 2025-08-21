
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Download, Mail, File, FileImage, FileArchive } from 'lucide-react';
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
  const handleDirectDownload = (format: 'pdf' | 'png' | 'zpl' = 'pdf') => {
    if (labelUrl) {
      // Direct download to PDF URL - opens in new tab
      window.open(labelUrl, '_blank');
      toast.success(`Opening ${format.toUpperCase()} label in new tab`);
    } else {
      toast.error('Label URL not available');
    }
  };

  const handleEmailLabel = () => {
    // TODO: Implement email functionality - requires backend integration
    toast.info('Email functionality requires backend setup. Please contact support to enable email sending.');
  };

  return (
    <div className="space-y-4 w-full">
      {/* Print Preview & Email Section - Top Priority */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Preview & Share Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <EnhancedPrintPreview
            labelUrl={labelUrl}
            trackingCode={trackingCode}
            shipmentId={shipmentId}
            shipmentDetails={shipmentDetails}
            triggerButton={
              <Button
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50 text-purple-700 h-11 font-medium"
              >
                <Eye className="h-4 w-4 mr-2" />
                Print Preview & Formats
              </Button>
            }
          />

          <Button
            variant="outline"
            onClick={handleEmailLabel}
            className="border-blue-200 hover:bg-blue-50 text-blue-700 h-11 font-medium"
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Label
          </Button>
        </div>
      </div>

      {/* Quick Download Options */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Download className="h-5 w-5 mr-2" />
          Quick Downloads
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer group">
            <File className="h-8 w-8 mx-auto mb-2 text-red-600 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-red-800 mb-1">PDF</h4>
            <p className="text-xs text-red-600 mb-3">Best for printing</p>
            <Button
              onClick={() => handleDirectDownload('pdf')}
              className="bg-red-600 hover:bg-red-700 text-white w-full h-8 text-sm"
            >
              <Download className="h-3 w-3 mr-1" />
              PDF
            </Button>
          </div>

          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer group">
            <FileImage className="h-8 w-8 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-green-800 mb-1">PNG</h4>
            <p className="text-xs text-green-600 mb-3">Image format</p>
            <Button
              onClick={() => handleDirectDownload('png')}
              className="bg-green-600 hover:bg-green-700 text-white w-full h-8 text-sm"
            >
              <Download className="h-3 w-3 mr-1" />
              PNG
            </Button>
          </div>

          <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4 text-center hover:shadow-md transition-all cursor-pointer group">
            <FileArchive className="h-8 w-8 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
            <h4 className="font-semibold text-purple-800 mb-1">ZPL</h4>
            <p className="text-xs text-purple-600 mb-3">Thermal printers</p>
            <Button
              onClick={() => handleDirectDownload('zpl')}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full h-8 text-sm"
            >
              <Download className="h-3 w-3 mr-1" />
              ZPL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NormalShippingLabelOptions;

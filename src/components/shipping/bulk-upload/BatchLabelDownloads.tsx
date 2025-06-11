
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Printer, Eye } from 'lucide-react';
import { BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

interface BatchLabelDownloadsProps {
  results: BulkUploadResult;
  onDownloadBatch: (format: 'png' | 'pdf' | 'zpl') => void;
  onPrintPreview: () => void;
}

const BatchLabelDownloads: React.FC<BatchLabelDownloadsProps> = ({
  results,
  onDownloadBatch,
  onPrintPreview
}) => {
  const shipmentsWithLabels = results.processedShipments?.filter(shipment => 
    shipment.label_url || shipment.label_urls?.png
  ) || [];

  const handleBatchDownload = (format: 'png' | 'pdf' | 'zpl') => {
    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for download');
      return;
    }
    
    toast.success(`Preparing ${format.toUpperCase()} batch download for ${shipmentsWithLabels.length} labels`);
    onDownloadBatch(format);
  };

  return (
    <Card className="p-6 border-blue-200 bg-blue-50">
      <div className="flex items-center mb-4">
        <Download className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-blue-800">
          Batch Label Downloads ({shipmentsWithLabels.length} Labels)
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Print Preview */}
        <Button 
          onClick={onPrintPreview}
          className="bg-purple-600 hover:bg-purple-700 text-white h-16 flex flex-col items-center justify-center"
        >
          <Eye className="h-5 w-5 mb-1" />
          <span className="text-sm">Print Preview</span>
        </Button>

        {/* Batch PDF Download */}
        <Button 
          onClick={() => handleBatchDownload('pdf')}
          className="bg-red-600 hover:bg-red-700 text-white h-16 flex flex-col items-center justify-center"
          disabled={shipmentsWithLabels.length === 0}
        >
          <FileText className="h-5 w-5 mb-1" />
          <span className="text-sm">Batch PDF</span>
          <span className="text-xs opacity-80">{shipmentsWithLabels.length} labels</span>
        </Button>
        
        {/* Batch PNG Download */}
        <Button 
          onClick={() => handleBatchDownload('png')}
          className="bg-green-600 hover:bg-green-700 text-white h-16 flex flex-col items-center justify-center"
          disabled={shipmentsWithLabels.length === 0}
        >
          <Download className="h-5 w-5 mb-1" />
          <span className="text-sm">Batch PNG</span>
          <span className="text-xs opacity-80">{shipmentsWithLabels.length} labels</span>
        </Button>
        
        {/* Batch ZPL Download */}
        <Button 
          onClick={() => handleBatchDownload('zpl')}
          className="bg-gray-600 hover:bg-gray-700 text-white h-16 flex flex-col items-center justify-center"
          disabled={shipmentsWithLabels.length === 0}
        >
          <Printer className="h-5 w-5 mb-1" />
          <span className="text-sm">Batch ZPL</span>
          <span className="text-xs opacity-80">{shipmentsWithLabels.length} labels</span>
        </Button>
      </div>
      
      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-blue-800 text-sm">
          <strong>Batch Downloads:</strong> Download all labels at once in your preferred format. 
          PDF batch files are optimized for printing, while individual formats are available in the table below.
        </p>
      </div>
    </Card>
  );
};

export default BatchLabelDownloads;

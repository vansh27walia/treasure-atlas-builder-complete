
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Package } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface BatchDownloadProps {
  batchId: string;
  batchLabelUrl?: string;
  totalShipments: number;
  onDownloadBatch: () => void;
}

const BatchDownload: React.FC<BatchDownloadProps> = ({
  batchId,
  batchLabelUrl,
  totalShipments,
  onDownloadBatch
}) => {
  const handleDownloadBatchLabel = () => {
    if (!batchLabelUrl) {
      toast.error('Batch label not available');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = batchLabelUrl;
      link.download = `batch_label_${batchId}.pdf`;
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Batch label download started');
    } catch (error) {
      toast.error('Failed to download batch label');
    }
  };

  return (
    <Card className="p-4 border-blue-200 bg-blue-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-800">Batch Download</h3>
            <p className="text-sm text-blue-600">
              Consolidated label for {totalShipments} shipments
            </p>
            <p className="text-xs text-blue-500">Batch ID: {batchId}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {batchLabelUrl && (
            <Button 
              onClick={handleDownloadBatchLabel}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Batch PDF
            </Button>
          )}
          
          <Button 
            onClick={onDownloadBatch}
            variant="outline"
            className="border-blue-200 hover:bg-blue-100"
          >
            <Download className="mr-2 h-4 w-4" />
            Download All Individual
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BatchDownload;

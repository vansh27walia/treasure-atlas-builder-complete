
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Info, Brain } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ onDownloadTemplate }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Smart CSV Bulk Shipping Upload</h2>
          <p className="text-gray-600 mt-1">
            Upload any CSV file - AI will map your headers to EasyPost format automatically
          </p>
        </div>
        <Button onClick={onDownloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download EasyPost Template (Optional)
        </Button>
      </div>
      
      <Alert className="border-blue-200 bg-blue-50 mb-4">
        <Brain className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>🚀 New: AI-Powered Header Mapping!</strong> Upload any CSV with any headers. 
          Our AI will analyze your file and suggest mappings to the EasyPost format. 
          You can review and adjust the mappings before processing.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-green-200 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Live EasyPost Integration:</strong> All rates are fetched live from EasyPost API 
          with real carrier rates and tracking numbers. Pickup addresses are selected from your saved addresses.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BulkUploadHeader;

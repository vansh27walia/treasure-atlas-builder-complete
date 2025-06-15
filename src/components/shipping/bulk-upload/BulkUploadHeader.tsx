
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ onDownloadTemplate }) => {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Shipping Upload</h2>
          <p className="text-gray-600 mt-1">
            Upload any file format to create multiple shipping labels with live carrier rates
          </p>
        </div>
        <Button onClick={onDownloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
      </div>
      
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Smart File Processing:</strong> Upload files in any format (CSV, Excel, Word, JSON, XML, TXT). 
          Our AI will automatically convert your data to the correct shipping format. 
          All rates are fetched live from multiple carriers with real tracking numbers.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BulkUploadHeader;

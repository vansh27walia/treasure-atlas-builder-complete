
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
            Upload a CSV file to create multiple shipping labels at once
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
          <strong>EasyPost Format:</strong> Use our CSV template that follows EasyPost's recommended structure. 
          Only recipient addresses go in the CSV - pickup addresses are selected from your saved addresses.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BulkUploadHeader;

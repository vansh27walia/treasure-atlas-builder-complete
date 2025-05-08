
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ 
  onDownloadTemplate 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center text-blue-800">
          <Upload className="mr-2 h-6 w-6 text-blue-600" /> Bulk Shipping Upload
        </h2>
        <p className="text-gray-600 mt-1">Upload multiple shipments at once using our CSV template</p>
      </div>
      <Button 
        variant="outline" 
        onClick={onDownloadTemplate}
        className="border-blue-300 hover:bg-blue-50"
      >
        <FileText className="mr-2 h-4 w-4" />
        Download Template
      </Button>
    </div>
  );
};

export default BulkUploadHeader;

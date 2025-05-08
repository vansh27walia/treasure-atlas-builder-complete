
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
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold flex items-center">
        <Upload className="mr-2" /> Bulk Shipping Upload
      </h2>
      <Button variant="outline" onClick={onDownloadTemplate}>
        <FileText className="mr-2 h-4 w-4" />
        Download Template
      </Button>
    </div>
  );
};

export default BulkUploadHeader;

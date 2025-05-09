
import React from 'react';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Package2, DownloadCloud } from 'lucide-react';

interface BulkUploadHeaderProps {
  onDownloadTemplate: () => void;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({ 
  onDownloadTemplate 
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
      <div>
        <Heading as="h3" className="text-2xl font-bold flex items-center">
          <Package2 className="h-6 w-6 mr-2 text-primary" />
          Bulk Shipment Upload
        </Heading>
        <p className="text-gray-600 mt-1">
          Upload multiple shipments at once and manage them efficiently
        </p>
      </div>
      
      <div className="mt-4 sm:mt-0">
        <Button onClick={onDownloadTemplate} variant="outline" className="flex items-center gap-2">
          <DownloadCloud className="h-4 w-4" />
          Download Template
        </Button>
      </div>
    </div>
  );
};

export default BulkUploadHeader;

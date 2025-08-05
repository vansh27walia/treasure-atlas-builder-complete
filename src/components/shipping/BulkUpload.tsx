
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import BulkUploadView from './bulk-upload/BulkUploadView';

const BulkUpload: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Shipping Upload</h1>
          <p className="text-gray-600">
            Upload a CSV file with multiple shipping addresses to process labels in bulk.
          </p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <BulkUploadView />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BulkUpload;


import React from 'react';
import BulkUpload from '@/components/shipping/BulkUpload';

const BulkUploadPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Shipping</h1>
          <p className="text-gray-600">
            Upload a CSV file with multiple shipments and process them efficiently.
          </p>
        </div>
        
        <BulkUpload />
      </div>
    </div>
  );
};

export default BulkUploadPage;

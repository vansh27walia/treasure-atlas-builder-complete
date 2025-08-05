
import React from 'react';

const BulkUploadHeader: React.FC = () => {
  return (
    <div className="text-center py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Shipping Upload</h1>
      <p className="text-gray-600">Upload your CSV file and generate shipping labels in bulk</p>
    </div>
  );
};

export default BulkUploadHeader;

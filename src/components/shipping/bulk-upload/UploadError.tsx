
import React from 'react';
import { AlertCircle } from 'lucide-react';

const UploadError: React.FC = () => {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-center mb-2">
        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
        <h4 className="font-semibold text-red-800">Upload Failed</h4>
      </div>
      <p className="text-red-700">
        There was an error processing your bulk upload. Please check the file format and try again.
      </p>
    </div>
  );
};

export default UploadError;

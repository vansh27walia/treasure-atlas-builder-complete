
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const UploadError: React.FC = () => {
  return (
    <Card className="p-6 border-2 border-red-200 bg-red-50 mt-6">
      <div className="flex items-center mb-3">
        <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
        <h4 className="font-semibold text-lg text-red-800">Upload Failed</h4>
      </div>
      <p className="text-red-700">
        There was an error processing your bulk upload. Please check the file format and try again.
        Make sure your CSV file follows the required template structure.
      </p>
      <ul className="mt-3 list-disc list-inside text-red-700 text-sm">
        <li>Verify that all required columns are present</li>
        <li>Check that addresses are formatted correctly</li>
        <li>Ensure package dimensions and weights use valid numeric values</li>
        <li>Remove any special characters from fields</li>
      </ul>
    </Card>
  );
};

export default UploadError;

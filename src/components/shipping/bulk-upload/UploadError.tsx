
import React from 'react';
import { AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadErrorProps {
  onRetry?: () => void;
  onSelectNewFile?: () => void;
  errorMessage?: string;
}

const UploadError: React.FC<UploadErrorProps> = ({ 
  onRetry, 
  onSelectNewFile,
  errorMessage = "There was an error processing your bulk upload."
}) => {
  return (
    <Card className="p-6 border-2 border-red-200 bg-red-50 mt-6">
      <div className="flex items-center mb-3">
        <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
        <h4 className="font-semibold text-lg text-red-800">Upload Failed</h4>
      </div>
      
      <p className="text-red-700 mb-4">{errorMessage}</p>
      
      <div className="mb-4">
        <h5 className="font-medium text-red-800 mb-2">Common Issues:</h5>
        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
          <li>Missing required columns: name, street1, city, state, zip, country</li>
          <li>Invalid address formats or special characters</li>
          <li>Non-numeric values in package dimensions or weight fields</li>
          <li>Empty rows or incomplete data</li>
          <li>File encoding issues (save as UTF-8 CSV)</li>
        </ul>
      </div>
      
      <div className="flex gap-3">
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Upload
          </Button>
        )}
        
        {onSelectNewFile && (
          <Button 
            onClick={onSelectNewFile}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Upload className="h-4 w-4" />
            Select New File
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UploadError;

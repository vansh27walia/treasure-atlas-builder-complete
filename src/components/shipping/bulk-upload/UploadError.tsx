
import React from 'react';
import { AlertCircle, RefreshCw, Upload, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadErrorProps {
  onRetry?: () => void;
  onSelectNewFile?: () => void;
  onDownloadTemplate?: () => void;
  errorMessage?: string;
}

const UploadError: React.FC<UploadErrorProps> = ({ 
  onRetry, 
  onSelectNewFile,
  onDownloadTemplate,
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
        <h5 className="font-medium text-red-800 mb-2">Quick Checklist:</h5>
        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
          <li>Use our provided template (download from buttons above)</li>
          <li>Required columns: name, street1, city, state, zip, country</li>
          <li>Save file as CSV format (not Excel)</li>
          <li>No empty rows between data</li>
          <li>Column headers must match exactly (lowercase, no extra spaces)</li>
          <li>Addresses should not contain special characters like quotes</li>
        </ul>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {onDownloadTemplate && (
          <Button 
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Download Template
          </Button>
        )}
        
        {onSelectNewFile && (
          <Button 
            onClick={onSelectNewFile}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Select New File
          </Button>
        )}
        
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </div>
    </Card>
  );
};

export default UploadError;

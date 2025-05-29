
import React from 'react';
import { AlertCircle, RefreshCw, Upload, FileText, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UploadErrorProps {
  onRetry?: () => void;
  onSelectNewFile?: () => void;
  onDownloadTemplate?: () => void;
  errorMessage?: string;
  detailedErrors?: string[];
}

const UploadError: React.FC<UploadErrorProps> = ({ 
  onRetry, 
  onSelectNewFile,
  onDownloadTemplate,
  errorMessage = "There was an error processing your bulk upload.",
  detailedErrors = []
}) => {
  const handleDownloadTemplate = () => {
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
      'John Doe,ACME Inc,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8',
      'Bob Johnson,Global LLC,789 Pine St,,New York,NY,10001,US,5555551234,15,10,6,25'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'bulk_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    if (onDownloadTemplate) {
      onDownloadTemplate();
    }
  };

  return (
    <Card className="p-6 border-2 border-red-200 bg-red-50 mt-6">
      <div className="flex items-center mb-3">
        <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
        <h4 className="font-semibold text-lg text-red-800">Upload Failed</h4>
      </div>
      
      <p className="text-red-700 mb-4">{errorMessage}</p>
      
      {detailedErrors.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-red-800 mb-2">Specific Issues Found:</h5>
          <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
            {detailedErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-4">
        <h5 className="font-medium text-red-800 mb-2">Quick Checklist:</h5>
        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
          <li>Use our provided template (download button below)</li>
          <li>Required columns: name, street1, city, state, zip, country</li>
          <li>Save file as CSV format (not Excel)</li>
          <li>No empty rows between data</li>
          <li>Column headers must match exactly (lowercase, no extra spaces)</li>
          <li>Addresses should not contain special characters like quotes</li>
        </ul>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download Template
        </Button>
        
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

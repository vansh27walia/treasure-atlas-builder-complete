
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BulkUploadForm2Props {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onDownloadTemplate: () => void;
}

const BulkUploadForm2: React.FC<BulkUploadForm2Props> = ({
  file,
  isUploading,
  uploadProgress,
  onFileChange,
  onUpload,
  onDownloadTemplate
}) => {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">1. Download Template</h3>
        <p className="text-gray-600 mb-3">
          Start by downloading our CSV template with the correct format
        </p>
        <Button onClick={onDownloadTemplate} variant="outline" className="flex items-center">
          <FileText className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="border-t border-gray-200 my-6 pt-6">
        <h3 className="text-lg font-medium mb-2">2. Upload Your File</h3>
        <p className="text-gray-600 mb-3">
          Upload your completed CSV file with shipping details
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center mb-4">
          <input
            type="file"
            id="csv-upload"
            accept=".csv"
            onChange={onFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center justify-center"
          >
            <Upload className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-blue-600">
              {file ? file.name : 'Choose CSV file or drag it here'}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(2)} KB` : 'CSV file only'}
            </span>
          </label>
        </div>

        {file && (
          <div className="flex justify-end">
            <Button 
              onClick={onUpload} 
              disabled={isUploading || !file}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Processing...' : 'Process Shipments'}
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Processing file...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadForm2;

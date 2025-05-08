
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader } from 'lucide-react';

interface BulkUploadFormProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  progress: number;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUpload,
  isUploading,
  progress
}) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV file
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUploadClick = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="mb-6">
      <p className="text-gray-600 mb-4">
        Upload a CSV file with multiple shipping addresses to create shipments in bulk.
        Make sure your CSV file follows the template format.
      </p>
      
      <div className="flex gap-4 items-center">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="max-w-md"
        />
        <Button 
          onClick={handleUploadClick} 
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : 'Process Upload'}
        </Button>
      </div>
      
      {isUploading && progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {progress < 100 ? 'Processing...' : 'Complete'} ({progress}%)
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkUploadForm;

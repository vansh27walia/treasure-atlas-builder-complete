
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Loader, Upload, FileText, ArrowRight } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } else {
      fileInputRef.current?.click();
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check if it's a CSV file
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      }
    }
  };

  return (
    <div className="mb-8 bg-white p-6 rounded-lg border-2 border-dashed border-blue-200 shadow-sm">
      <div className="flex flex-col items-center text-center mb-6">
        <FileText className="h-12 w-12 text-blue-500 mb-3" />
        <h3 className="text-xl font-semibold mb-2">Upload Shipping Data</h3>
        <p className="text-gray-600 mb-1 max-w-lg">
          Upload a CSV file with multiple shipping addresses to create shipments in bulk.
          Make sure your CSV file follows the template format.
        </p>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-4 flex flex-col items-center justify-center cursor-pointer transition-colors
          ${isDragging ? 'bg-blue-50 border-blue-400' : file ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {file ? (
          <>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium text-green-700 mb-1">{file.name}</p>
            <p className="text-sm text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-lg font-medium mb-1">Drop your CSV file here</p>
            <p className="text-sm text-gray-500">or click to browse your files</p>
          </>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button 
          onClick={handleUploadClick} 
          disabled={isUploading}
          size="lg"
          className="px-8 bg-blue-600 hover:bg-blue-700"
        >
          {isUploading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : file ? (
            <>
              Process Upload
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            'Select File'
          )}
        </Button>
      </div>
      
      {isUploading && progress > 0 && (
        <div className="mt-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 text-center mt-2">
            {progress < 100 
              ? `Processing shipments (${progress}%)...` 
              : 'Processing complete! Preparing shipment options...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkUploadForm;

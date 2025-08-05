
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface CSVUploaderProps {
  onUpload: (file: File) => Promise<void>;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      await onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        onClick={handleUploadClick}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Upload className="mr-2 h-4 w-4" />
        Choose CSV File
      </Button>
    </div>
  );
};

export default CSVUploader;

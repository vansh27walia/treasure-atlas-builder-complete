import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface AIBatchUploaderProps {
  onNavigateToBatch?: () => void;
  compact?: boolean;
}

const AIBatchUploader: React.FC<AIBatchUploaderProps> = ({ onNavigateToBatch, compact }) => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      
      // Store file reference for batch page
      sessionStorage.setItem('pending-batch-file', file.name);
      
      // Auto-navigate after brief delay
      setTimeout(() => {
        navigate('/bulk-upload');
      }, 1500);
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleNavigate = () => {
    if (onNavigateToBatch) {
      onNavigateToBatch();
    } else {
      navigate('/bulk-upload');
    }
  };

  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:shadow-md transition-shadow cursor-pointer" onClick={handleNavigate}>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">Batch Upload</h4>
            <p className="text-xs text-gray-500">Upload CSV for multiple labels</p>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Batch Label Creation</h3>
            <p className="text-sm text-gray-500">Upload a CSV file to create multiple labels at once</p>
          </div>
        </div>

        {uploadedFile ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-green-800">{uploadedFile.name}</p>
              <p className="text-sm text-green-600">Redirecting to batch page...</p>
            </div>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-purple-500' : 'text-gray-400'}`} />
            <p className="text-gray-600 mb-2">
              {isDragActive ? 'Drop your CSV here...' : 'Drag & drop your CSV file here'}
            </p>
            <p className="text-sm text-gray-400">or click to browse</p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleNavigate}
          >
            Go to Batch Page
          </Button>
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handleNavigate}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIBatchUploader;

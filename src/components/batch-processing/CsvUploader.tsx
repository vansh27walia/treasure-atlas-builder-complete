
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { validateCsvStructure, REQUIRED_HEADERS } from '@/utils/csvValidator';

interface CsvUploaderProps {
  onFileSelect: (file: File, rowCount: number) => void;
  isProcessing: boolean;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    
    try {
      const content = await file.text();
      const validation = validateCsvStructure(content);
      setValidationResult(validation);
      
      if (validation.isValid) {
        toast.success(`Valid CSV file with ${validation.rowCount} data rows`);
        onFileSelect(file, validation.rowCount || 0);
      } else {
        toast.error(validation.error);
      }
    } catch (error) {
      toast.error('Failed to read CSV file');
      setValidationResult({ isValid: false, error: 'Failed to read file' });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const downloadTemplate = () => {
    const templateContent = [
      REQUIRED_HEADERS.join(','),
      '"123456789","123 Main St, NY","John Doe","UPS","10x5x5","2 lbs","2025-06-16"',
      '"987654321","456 Oak Ave, CA","Jane Smith","FedEx","12x8x6","3.5 lbs","2025-06-17"'
    ].join('\n');
    
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'batch_label_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Template downloaded successfully');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Upload CSV File</h3>
        <Button onClick={downloadTemplate} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
      
      <Card
        className={`relative cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isProcessing}
          />
          
          <div className="flex flex-col items-center text-center space-y-4">
            <Upload className={`h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            
            <div>
              <p className="text-lg font-medium">
                {selectedFile ? selectedFile.name : 'Choose a CSV file or drag it here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                CSV files only. Maximum file size: 10MB
              </p>
            </div>
            
            <Button variant="outline" disabled={isProcessing}>
              <FileText className="h-4 w-4 mr-2" />
              Select CSV File
            </Button>
          </div>
        </CardContent>
      </Card>

      {validationResult && (
        <Alert className={validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {validationResult.isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={validationResult.isValid ? 'text-green-800' : 'text-red-800'}>
            {validationResult.isValid 
              ? `✅ CSV validation passed! Found ${validationResult.rowCount} data rows to process.`
              : `❌ ${validationResult.error}`
            }
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertDescription>
          <strong>Required CSV Format:</strong>
          <div className="mt-2 text-sm font-mono bg-gray-100 p-2 rounded">
            {REQUIRED_HEADERS.join(' | ')}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CsvUploader;

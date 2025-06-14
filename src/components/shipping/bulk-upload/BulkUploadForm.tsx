
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/sonner';
import AddressSelector from '@/components/shipping/AddressSelector';
import { SavedAddress } from '@/types/shipping';

interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File) => Promise<void>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedPickupAddressId, setSelectedPickupAddressId] = React.useState<string>('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        toast.success(`File "${acceptedFiles[0].name}" selected`);
      }
    },
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error("Please select a CSV file to upload.");
      return;
    }

    if (!selectedPickupAddressId) {
      toast.error("Please select a pickup address.");
      return;
    }

    try {
      await handleUpload(selectedFile);
    } catch (error) {
      console.error('Upload error:', error);
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'recipient_name',
      'company',
      'street1', 
      'street2',
      'city',
      'state',
      'zip',
      'country',
      'phone',
      'email',
      'weight',
      'length',
      'width', 
      'height',
      'value',
      'reference'
    ];
    
    const csvContent = [
      headers.join(','),
      'John Doe,Acme Corp,123 Main St,Apt 1,Anytown,CA,12345,US,555-1234,john@example.com,2.5,10,8,6,25.00,ORDER-001'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_shipping_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pickup Address Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Select Pickup Address</h3>
        </div>
        <AddressSelector
          selectedAddressId={selectedPickupAddressId}
          onAddressSelect={onPickupAddressSelect}
          addressType="from"
        />
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Upload CSV File</h3>
          </div>
          <Button 
            type="button"
            variant="outline" 
            onClick={downloadTemplate}
            className="flex items-center space-x-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Template</span>
          </Button>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-green-600">
                Selected: {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-600">
                {isDragActive 
                  ? "Drop the CSV file here..." 
                  : "Drag & drop a CSV file here, or click to select"
                }
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Supported format: CSV files only
              </p>
            </div>
          )}
        </div>

        {selectedFile && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ready to upload <strong>{selectedFile.name}</strong>. 
              Make sure your CSV follows our template format for best results.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={!selectedFile || !selectedPickupAddressId || isUploading}
        size="lg"
        className="w-full"
      >
        {isUploading ? (
          <>
            <Upload className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload and Process
          </>
        )}
      </Button>
    </form>
  );
};

export default BulkUploadForm;

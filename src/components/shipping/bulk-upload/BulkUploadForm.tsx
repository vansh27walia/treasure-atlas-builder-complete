import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddressSelector from '../AddressSelector';
import { SavedAddress, BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BulkUploadFormProps {
  onUploadSuccess: (results: BulkUploadResult) => void; 
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean; // This represents the overall state from useBulkUpload hook
  progress: number; // This is overall progress from useBulkUpload hook, if applicable to UI here
  handleUpload: (file: File) => Promise<void>; // The main upload function from the hook
  currentPickupAddress?: SavedAddress | null; // Added prop
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess, // Not directly used in this component's submit logic, handleUpload encapsulates it
  onUploadFail,    // Not directly used
  onPickupAddressSelect,
  isUploading, // True if parsing file or fetching rates
  progress,    // Parsing progress %
  handleUpload,  // Hook's function to start the entire upload and processing flow
  currentPickupAddress,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // This local state might be redundant if currentPickupAddress is managed by parent via onPickupAddressSelect
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<SavedAddress | null>(currentPickupAddress || null);

  useEffect(() => {
    setSelectedPickupAddress(currentPickupAddress || null);
  }, [currentPickupAddress]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const currentFile = acceptedFiles[0];
      // Basic CSV/Excel type check (can be expanded)
      if (currentFile.type === 'text/csv' || 
          currentFile.type === 'application/vnd.ms-excel' || 
          currentFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        setFile(currentFile);
        setUploadError(null);
      } else {
        setUploadError("Invalid file type. Please upload a CSV or Excel file.");
        setFile(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setUploadError("Please select a file to upload.");
      return;
    }
    if (!selectedPickupAddress) {
      // It's better to use toast for this kind of feedback
      toast.error("Please select a pickup address.");
      // setUploadError("Please select a pickup address."); 
      return;
    }
    
    setUploadError(null);
    // The handleUpload function from the hook now manages the entire process
    // including calling onUploadSuccess/onUploadFail internally via its own state updates.
    await handleUpload(file); 
  };

  const handleLocalPickupAddressSelect = (address: SavedAddress | null) => {
    setSelectedPickupAddress(address);
    onPickupAddressSelect(address); // Notify parent
  };
  
  const clearFile = () => {
    setFile(null);
    setUploadError(null);
    // Also reset the hidden file input's value
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };


  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Upload Your Shipments</CardTitle>
        <CardDescription>
          Select your sender address and upload a CSV/Excel file with shipment details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pickup-address" className="block text-sm font-medium text-gray-700 mb-1">
              Sender / Pickup Address
            </label>
            <AddressSelector
              selectedAddressId={selectedPickupAddress?.id || null}
              onAddressSelect={handleLocalPickupAddressSelect}
              addressType="from"
              showAddNewOption={true}
            />
            {!selectedPickupAddress && (
                 <p className="text-xs text-red-500 mt-1">Pickup address is required.</p>
            )}
          </div>

          <div
            {...getRootProps()}
            className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${uploadError ? 'border-red-500 bg-red-50' : ''}
              ${file ? 'border-green-500 bg-green-50' : ''}
            `}
          >
            <input {...getInputProps()} id="file-upload-input" />
            <UploadCloud className={`mx-auto h-12 w-12 mb-3 ${file ? 'text-green-600' : 'text-gray-400'}`} />
            {file ? (
              <>
                <p className="text-sm font-medium text-green-700">
                  <CheckCircle className="inline-block h-5 w-5 mr-1" /> {file.name} selected
                </p>
                <p className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="mt-2 text-xs text-red-600 hover:text-red-800">
                  <X className="h-3 w-3 mr-1" /> Clear file
                </Button>
              </>
            ) : isDragActive ? (
              <p className="text-sm text-blue-600">Drop the file here ...</p>
            ) : (
              <p className="text-sm text-gray-500">Drag 'n' drop a CSV/Excel file here, or click to select file</p>
            )}
          </div>
          
          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          
          {/* The progress bar and uploading status are now better handled in the parent BulkUpload component */}
          {/* We can remove isUploading and progress display from here if parent shows global status */}

          <Button type="submit" className="w-full" disabled={isUploading || !file || !selectedPickupAddress}>
            {isUploading ? 'Processing...' : 'Upload and Process File'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BulkUploadForm;

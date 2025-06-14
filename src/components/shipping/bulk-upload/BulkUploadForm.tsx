
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, FileText, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddressSelector from '@/components/shipping/AddressSelector';
import { SavedAddress, BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

interface BulkUploadFormProps {
  onUploadSuccess: (results: BulkUploadResult) => void; 
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload: (file: File) => Promise<void>; // Changed from (file, pickupAddress)
  currentPickupAddress?: SavedAddress | null; // Added prop
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess, // This might be redundant if handleUpload updates global state
  onUploadFail,    // This might be redundant if handleUpload updates global state
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload,
  currentPickupAddress, // Use this prop
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  // const [localPickupAddress, setLocalPickupAddress] = useState<SavedAddress | null>(currentPickupAddress || null);

  // useEffect(() => {
  //   setLocalPickupAddress(currentPickupAddress || null);
  // }, [currentPickupAddress]);


  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setFileError(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
      setFileError(rejectedFiles[0].errors[0].message || 'Invalid file type or size.');
      setFile(null);
      return;
    }
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleSubmit = async () => {
    if (!file) {
      setFileError('Please select a file to upload.');
      return;
    }
    if (!currentPickupAddress) {
        toast.error("Please select a pickup address before uploading.");
        return;
    }
    setFileError(null);
    // The handleUpload function from useBulkUpload should now use the pickupAddress from its own state.
    await handleUpload(file); 
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
  };

  const handleLocalPickupAddressSelect = (address: SavedAddress | null) => {
    // setLocalPickupAddress(address);
    onPickupAddressSelect(address); // Notify parent about the change
  };


  return (
    <div className="space-y-6">
      <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 transition-colors bg-gray-50"
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        {isDragActive ? (
          <p className="text-blue-600 font-semibold">Drop the file here ...</p>
        ) : (
          <p className="text-gray-500">Drag & drop your CSV, XLS, or XLSX file here, or <span className="text-blue-600 font-semibold">click to select</span>.</p>
        )}
        <p className="text-xs text-gray-400 mt-1">Max file size: 10MB.</p>
      </div>

      {fileError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Error</AlertTitle>
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {file && !fileError && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">File Selected: {file.name}</AlertTitle>
          <AlertDescription className="text-green-700 flex justify-between items-center">
            <span>Ready to upload.</span>
            <Button variant="ghost" size="sm" onClick={removeFile} className="text-red-500 hover:text-red-700">
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isUploading && progress > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-700">Uploading: {file?.name}</p>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-xs text-blue-600">{progress}% complete</p>
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Pickup Address</label>
        <AddressSelector
            selectedAddressId={currentPickupAddress?.id || null}
            onAddressSelect={handleLocalPickupAddressSelect}
            addressType="from"
            disabled={isUploading}
        />
         {!currentPickupAddress && (
             <p className="text-xs text-red-500 mt-1">Pickup address is required to process shipments.</p>
         )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!file || !!fileError || isUploading || !currentPickupAddress}
        className="w-full text-base py-3"
        size="lg"
      >
        {isUploading ? 'Processing...' : 'Upload and Process Shipments'}
      </Button>
    </div>
  );
};

export default BulkUploadForm;


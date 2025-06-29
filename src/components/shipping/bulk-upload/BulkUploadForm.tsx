import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Not directly used but often helpful for forms
import { Label } from '@/components/ui/label';
import { Upload, FileText, MapPin, AlertCircle, Loader2 } from 'lucide-react'; // Added Loader2 for button spinner
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

// Re-including the AddressForm and SelectAddressDropdown (or their concepts) if needed,
// but for this combined code, we'll use the direct Select from the second version.
// The CsvHeaderMapper is crucial based on your request.
import CsvHeaderMapper from './CsvHeaderMapper'; // Assuming this component exists
import { addressService, SavedAddress } from '@/services/AddressService'; // Keeping address service

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean; // Made optional as it might be managed internally or by parent
  progress?: number;    // Made optional
  handleUpload?: (file: File) => Promise<any>; // Changed to Promise<any> to match first code's flexibility
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false, // Default to false if not provided
  progress = 0,       // Default to 0 if not provided
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [csvContent, setCsvContent] = useState<string>(''); // From first code
  const [showHeaderMapper, setShowHeaderMapper] = useState(false); // From first code

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setAvailableAddresses(addresses);

        // Set default address
        const defaultAddress = addresses.find(addr => addr.is_default_from); // Use find directly on addresses
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id.toString());
          onPickupAddressSelect(defaultAddress);
        } else if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id.toString());
          onPickupAddressSelect(addresses[0]);
        }

        setAddressesLoaded(true);
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load pickup addresses');
        setAddressesLoaded(true); // Ensure addressesLoaded is set even on error
      }
    };

    loadAddresses();
  }, [onPickupAddressSelect]); // Dependency added for completeness

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    onPickupAddressSelect(selectedAddress || null);
  };

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    setSelectedFile(file);

    // Read file content for header mapping
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setShowHeaderMapper(true); // Trigger header mapper
    };
    reader.readAsText(file);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleMappingComplete = async (convertedCsv: string) => {
    console.log('Header mapping complete, proceeding with converted CSV');

    // Create a new File object with the converted CSV content
    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    // Use original file name or a default if not available
    const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });

    try {
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({}); // Pass empty object if results aren't directly from mapping
        setShowHeaderMapper(false);
      } else {
        onUploadFail('Upload handler not available');
        toast.error('Upload handler not available');
      }
    } catch (error) {
      console.error('Upload error after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process converted file';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    // Reset file input for re-selection
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('CSV header mapping cancelled.');
  };


  const handleSubmit = async () => {
    // This handleSubmit will now only be callable if header mapping is not active
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    const currentPickupAddress = availableAddresses.find(addr => addr.id.toString() === selectedAddressId);
    if (!currentPickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    // If a file is selected and mapping is needed, the `handleMappingComplete` path will be taken first.
    // This submit button implies the file is ready, or mapping is skipped if CsvHeaderMapper doesn't render.
    // However, given the `showHeaderMapper` logic, this path should only be taken if `handleUpload` is called directly,
    // or if `showHeaderMapper` is never true for some reason.
    // To be precise: If `showHeaderMapper` is true, the CsvHeaderMapper component is rendered instead of this form.
    // So this button is for initiating upload *after* mapping, or if mapping is not required.
    // Based on the first code, mapping is always triggered on file select.
    // So this submit will likely only be hit if mapping completed, or if the initial file selection
    // didn't trigger mapping (which it should).
    // Let's assume for this merged code, the primary upload path *goes through* the mapper if a file is chosen.

    if (csvContent && showHeaderMapper) {
        // This case should ideally not be reachable if the UI correctly renders CsvHeaderMapper
        // or if handleMappingComplete is the direct trigger for upload.
        // If it were reachable, it would imply a direct upload without mapping, which
        // contradicts the first code's flow.
        toast.error('Please complete header mapping first.');
        return;
    }

    // This path is for when a file is selected and ready for upload, possibly after mapping (handled in handleMappingComplete)
    // or if there's no mapping step (not the case here with CsvHeaderMapper).
    // Given the structure, the actual upload trigger after a user interaction (like drag/drop or file select)
    // should lead to `processFile` which then leads to `showHeaderMapper`.
    // The final `handleUpload` is then called from `handleMappingComplete`.
    // So, this button should conceptually be `disabled` while mapping is outstanding.
    // Its primary role is if the user navigates back to this form after some external action,
    // or if the `handleUpload` needs to be explicitly triggered by a separate user action.
    // For now, let's keep it consistent with the previous logic where `handleUpload` is called
    // only from `handleMappingComplete` or if `showHeaderMapper` is false from the start.

    try {
      if (handleUpload && selectedFile) {
        // This scenario implies a file might be selected but not yet mapped, or mapping was skipped.
        // Given the design, `processFile` always triggers the mapper.
        // So this block might be redundant or only for specific edge cases.
        // We'll keep it for robustness, assuming `showHeaderMapper` could somehow be false.
        await handleUpload(selectedFile);
        onUploadSuccess({ message: 'Upload successful' });
      } else {
        onUploadFail('Upload handler or selected file not available.');
        toast.error('Upload handler or selected file not available.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Conditionally render CsvHeaderMapper if `showHeaderMapper` is true and `csvContent` is available
  if (showHeaderMapper && csvContent) {
    return (
      <div className="space-y-6">
        <CsvHeaderMapper
          csvContent={csvContent}
          onMappingComplete={handleMappingComplete}
          onCancel={handleMappingCancel}
        />
      </div>
    );
  }

  // Main BulkUploadForm UI (from second code's design)
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection - Centered */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="h-5 w-5 text-blue-600" />
          <Label className="text-lg font-medium">Select Pickup Address</Label>
        </div>

        {!addressesLoaded ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 rounded-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Loading pickup addresses...</span>
          </div>
        ) : availableAddresses.length > 0 ? (
          <div className="flex justify-center">
            <Select value={selectedAddressId} onValueChange={handleAddressChange} disabled={isUploading}>
              <SelectTrigger className="w-full max-w-md p-4 text-left bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose your pickup address" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {availableAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()} className="hover:bg-gray-50 cursor-pointer">
                    <div className="flex flex-col">
                      <span className="font-medium">{address.name}</span>
                      <span className="text-sm text-gray-600">
                        {address.street1}, {address.city}, {address.state} {address.zip}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No pickup addresses found. Please add a pickup address in Settings before uploading.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">Upload CSV File</Label>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-500 bg-blue-50 scale-105'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload-input')?.click()} // Trigger hidden input on click
        >
          <input
            id="file-upload-input" // Unique ID for click trigger
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading || showHeaderMapper} // Disable if uploading or mapper is active
          />

          <div className="space-y-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              selectedFile ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {selectedFile ? (
                <FileText className="h-8 w-8 text-white" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>

            {selectedFile ? (
              <div>
                <p className="text-lg font-semibold text-green-800">File Selected</p>
                <p className="text-green-600">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
                {showHeaderMapper && (
                    <p className="text-orange-600 text-sm mt-2">
                        Please complete header mapping below.
                    </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-gray-500 mt-2">
                  Supports CSV files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && progress > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleSubmit} // This button will only be enabled when ready for final submission
        // Disable if no file, no address, currently uploading, or if the header mapper is showing
        disabled={!selectedFile || !selectedAddressId || isUploading || showHeaderMapper}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin mr-3" /> {/* Using Loader2 from lucide-react */}
            Processing Upload...
          </>
        ) : (
          <>
            <Upload className="mr-3 h-6 w-6" />
            Upload & Process CSV
          </>
        )}
      </Button>
    </div>
  );
};

export default BulkUploadForm;
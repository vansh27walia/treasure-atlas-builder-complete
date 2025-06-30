import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// Card and CardContent are imported but not used in the current structure, keeping for future potential use.
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // Input is imported but not directly used in the current structure, often helpful for forms.
import { Label } from '@/components/ui/label';
import { Upload, FileText, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner'; // Assuming sonner toast library is available and configured.

// MOCK DATA AND COMPONENTS FOR COMPILATION:
// Since the external modules './CsvHeaderMapper' and '@/services/AddressService'
// cannot be resolved in this environment, we are providing mock implementations
// for compilation purposes. In a real application, these would be separate files.

// MOCK SavedAddress interface
export interface SavedAddress {
  id: number;
  name: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  is_default_from?: boolean;
}

// MOCK AddressService
// This mock simulates fetching addresses. In a real app, this would involve API calls.
const mockAddresses: SavedAddress[] = [
  { id: 1, name: 'Main Warehouse', street1: '123 Tech St', city: 'San Francisco', state: 'CA', zip: '94105', is_default_from: true },
  { id: 2, name: 'Branch Office', street1: '456 Innovation Dr', city: 'San Jose', state: 'CA', zip: '95110' },
  { id: 3, name: 'Remote Hub', street1: '789 Future Ave', city: 'New York', state: 'NY', zip: '10001' },
];

const addressService = {
  getSavedAddresses: async (): Promise<SavedAddress[]> => {
    // Simulate API call delay
    return new Promise(resolve => setTimeout(() => resolve(mockAddresses), 500));
  },
  // Add other address service methods as needed (e.g., saveAddress, deleteAddress)
};

// MOCK CsvHeaderMapper Component
// This mock component will simply log that mapping is complete and call onMappingComplete.
// In a real application, this component would provide UI for mapping CSV headers.
interface CsvHeaderMapperProps {
  csvContent: string;
  onMappingComplete: (convertedCsv: string) => void;
  onCancel: () => void;
}

const CsvHeaderMapper: React.FC<CsvHeaderMapperProps> = ({ csvContent, onMappingComplete, onCancel }) => {
  useEffect(() => {
    // Simulate automatic mapping for the mock. In a real scenario, user interaction would be required.
    console.log('Mock CsvHeaderMapper: Simulating header mapping and completing.');
    // For demonstration, we'll just pass the original content back,
    // assuming the "mapping" makes no changes for this mock.
    // In a real scenario, this would involve parsing and converting the CSV.
    onMappingComplete(csvContent);
  }, [csvContent, onMappingComplete]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-center">CSV Header Mapping</h3>
      <p className="text-gray-700 text-center mb-6">
        This is a placeholder for the CSV Header Mapper.
        In a real application, you would map your CSV columns here.
      </p>
      <div className="flex justify-center space-x-4">
        <Button onClick={onCancel} className="bg-red-500 hover:bg-red-600 text-white">
          Cancel Mapping
        </Button>
        {/* The "Proceed" button is not directly needed for this mock as onMappingComplete is called in useEffect */}
      </div>
      <Alert className="mt-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Mapping is simulated for this demonstration.
        </AlertDescription>
      </Alert>
    </div>
  );
};
// END MOCK DATA AND COMPONENTS

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean; // Made optional as it might be managed internally or by parent
  progress?: number;     // Made optional
  handleUpload?: (file: File) => Promise<any>; // Changed to Promise<any> to match first code's flexibility
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false, // Default to false if not provided
  progress = 0,        // Default to 0 if not provided
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setAvailableAddresses(addresses);

        // Set default address
        const defaultAddress = addresses.find(addr => addr.is_default_from);
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
  }, [onPickupAddressSelect]);

  // Effect to reset form state after upload completes (or fails)
  // This listens to the `isUploading` prop from the parent.
  useEffect(() => {
    // If we were uploading and now we are not, it means the upload process
    // (controlled by the parent via `isUploading`) has completed or failed.
    // At this point, we can safely reset our internal form state.
    if (!isUploading && (selectedFile || csvContent || showHeaderMapper)) {
      // Only reset if there was an active file/mapper state
      console.log('Upload completed/failed (isUploading became false), resetting form state.');
      setSelectedFile(null);
      setCsvContent('');
      setShowHeaderMapper(false);
      // Reset file input for re-selection
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [isUploading, selectedFile, csvContent, showHeaderMapper]);

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
    console.log('Header mapping complete, proceeding with converted CSV for upload.');

    // Create a new File object with the converted CSV content
    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    // Use original file name or a default if not available
    const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });

    // The 'isUploading' prop should be managed by the parent component that calls 'handleUpload'.
    // We initiate the upload here.
    if (handleUpload) {
      try {
        await handleUpload(convertedFile);
        onUploadSuccess({}); // Notify parent of success
        // Do NOT reset internal states here directly.
        // The `useEffect` listening to `isUploading` will handle the reset
        // when the parent updates `isUploading` to false.
      } catch (error) {
        console.error('Upload error after mapping:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to process converted file';
        onUploadFail(errorMessage);
        toast.error(errorMessage);
        // In case of immediate error (e.g., handleUpload throws synchronously),
        // we might still need a manual reset to ensure the UI is not stuck.
        setShowHeaderMapper(false);
        setSelectedFile(null);
        setCsvContent('');
      }
    } else {
      onUploadFail('Upload handler not available');
      toast.error('Upload handler not available');
      // If handleUpload is not available, reset here as the useEffect won't trigger.
      setShowHeaderMapper(false);
      setSelectedFile(null);
      setCsvContent('');
    }
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    // Reset file input for re-selection
    const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    toast.info('CSV header mapping cancelled.');
  };

  // This function now acts as the primary click handler for the main button
  // and the file upload area, allowing selection if no file is present.
  const handleMainButtonClick = () => {
    // If no file is selected, clicking the button or drag-drop zone should open the file picker.
    if (!selectedFile) {
        document.getElementById('file-upload-input')?.click();
    } else {
        // If a file is selected and not uploading/mapping, this click might indicate a desire
        // to re-select a file or is redundant. Provide feedback.
        toast.info('File already selected. You can drop a new file or use the input below.');
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
          onClick={handleMainButtonClick} // Trigger hidden input on click via the main button handler
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
      {/* This button's behavior is refined. It acts as the initial "browse" trigger,
          and is disabled if mapping is active or upload is in progress. */}
      <Button
        onClick={handleMainButtonClick} // Use the new handler
        // Disabled if uploading, header mapper is showing, no address selected,
        // or if a file is selected AND the header mapper is showing (redundant but explicit).
        disabled={isUploading || showHeaderMapper || !selectedAddressId || (selectedFile && showHeaderMapper)}
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
            {selectedFile && !showHeaderMapper ? 'Re-upload or select new file' : 'Upload & Process CSV'}
          </>
        )}
      </Button>
    </div>
  );
};

export default BulkUploadForm;

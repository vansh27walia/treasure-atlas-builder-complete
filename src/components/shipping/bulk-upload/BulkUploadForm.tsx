
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CloudUpload, FileText, Upload, MapPin, AlertCircle } from 'lucide-react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';

// CSV Header Mapper Component
const CsvHeaderMapper = ({ csvContent, onMappingComplete, onCancel }) => {
  const [headers, setHeaders] = useState([]);
  const [mappedHeaders, setMappedHeaders] = useState({});
  const requiredFields = ['street1', 'city', 'state', 'zip'];

  useEffect(() => {
    if (csvContent) {
      const lines = csvContent.split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0];
        const parsedHeaders = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
        setHeaders(parsedHeaders);

        const initialMapping = {};
        parsedHeaders.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('street') && lowerHeader.includes('1')) initialMapping['street1'] = header;
          else if (lowerHeader.includes('street') && lowerHeader.includes('2')) initialMapping['street2'] = header;
          else if (lowerHeader.includes('city')) initialMapping['city'] = header;
          else if (lowerHeader.includes('state')) initialMapping['state'] = header;
          else if (lowerHeader.includes('zip') || lowerHeader.includes('postal')) initialMapping['zip'] = header;
          else if (lowerHeader.includes('name')) initialMapping['name'] = header;
          else if (lowerHeader.includes('company')) initialMapping['company'] = header;
          else if (lowerHeader.includes('country')) initialMapping['country'] = header;
          else if (lowerHeader.includes('phone')) initialMapping['phone'] = header;
        });
        setMappedHeaders(initialMapping);
      }
    }
  }, [csvContent]);

  const handleFieldChange = (field, csvHeader) => {
    setMappedHeaders(prev => ({ ...prev, [field]: csvHeader }));
  };

  const handleConfirm = () => {
    const missingRequired = requiredFields.filter(field => !mappedHeaders[field]);
    if (missingRequired.length > 0) {
      toast.error(`Please map all required fields: ${missingRequired.join(', ')}`);
      return;
    }

    console.log('Mapping confirmed:', mappedHeaders);
    toast.success('Header mapping complete!');
    onMappingComplete(csvContent, mappedHeaders);
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Map CSV Headers</h3>
      <p className="text-gray-600 mb-6">Match your CSV columns to the required address fields.</p>

      <div className="space-y-4">
        {['name', 'company', 'street1', 'street2', 'city', 'state', 'zip', 'country', 'phone'].map(field => (
          <div key={field} className="flex items-center justify-between">
            <Label className="w-1/3">
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}{' '}
              {requiredFields.includes(field) && <span className="text-red-500">*</span>}
            </Label>
            <Select value={mappedHeaders[field] || ''} onValueChange={(value) => handleFieldChange(field, value)}>
              <SelectTrigger className="w-2/3">
                <SelectValue placeholder="-- Select Column --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Select Column --</SelectItem>
                {headers.map(header => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2 mt-8">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleConfirm}>Confirm Mapping</Button>
      </div>
    </Card>
  );
};

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File, mappedHeaders?: Record<string, string>) => Promise<void>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);
  const [finalMappedHeaders, setFinalMappedHeaders] = useState<Record<string, string>>({});

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const addresses = await addressService.getSavedAddresses();
        setAvailableAddresses(addresses);

        const defaultAddress = await addressService.getDefaultFromAddress();
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id.toString());
          onPickupAddressSelect(defaultAddress);
        } else if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id.toString());
          onPickupAddressSelect(addresses[0]);
        } else {
          setSelectedAddressId('');
          onPickupAddressSelect(null);
        }

        setAddressesLoaded(true);
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load pickup addresses');
        setAddressesLoaded(true);
      }
    };

    loadAddresses();
  }, [onPickupAddressSelect]);

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    onPickupAddressSelect(selectedAddress || null);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setShowHeaderMapper(true);
    };
    reader.readAsText(file);
  };

  const handleMappingComplete = async (convertedCsv: string, mappedHeaders: Record<string, string>) => {
    console.log('Header mapping complete, ready for upload.');
    setFinalMappedHeaders(mappedHeaders);
    setShowHeaderMapper(false);
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    setFinalMappedHeaders({});
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select a pickup address');
      return;
    }

    if (Object.keys(finalMappedHeaders).length === 0) {
      toast.error('Please complete the CSV header mapping first.');
      setShowHeaderMapper(true);
      return;
    }

    try {
      await handleUpload(selectedFile, finalMappedHeaders);
      onUploadSuccess({ message: 'Upload successful' });
      // Reset form after successful upload
      setSelectedFile(null);
      setCsvContent('');
      setFinalMappedHeaders({});
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
    }
  };

  // If header mapper is active, render it instead of the main form
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

  // Main form rendering
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
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
            <Select value={selectedAddressId} onValueChange={handleAddressChange}>
              <SelectTrigger className="w-full max-w-md p-4 text-left bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Choose your pickup address" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {availableAddresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()}>
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
              : selectedFile && Object.keys(finalMappedHeaders).length > 0
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />

          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
            selectedFile ? (Object.keys(finalMappedHeaders).length > 0 ? 'bg-green-500' : 'bg-blue-500') : 'bg-blue-500'
          }`}>
            {selectedFile ? (
              <FileText className="h-8 w-8 text-white" />
            ) : (
              <Upload className="h-8 w-8 text-white" />
            )}
          </div>

          {selectedFile ? (
            <div>
              <p className="text-lg font-semibold text-gray-800">File Selected</p>
              <p className={`text-gray-600 ${Object.keys(finalMappedHeaders).length > 0 ? 'text-green-600' : ''}`}>
                {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
               {Object.keys(finalMappedHeaders).length === 0 && (
                <p className="text-sm text-orange-600 mt-2">
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

      {/* Upload Progress */}
      {isUploading && progress > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Upload Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      )}

      {/* Upload Button */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedFile || !selectedAddressId || isUploading || Object.keys(finalMappedHeaders).length === 0}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-6 text-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200"
        size="lg"
      >
        {isUploading ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
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

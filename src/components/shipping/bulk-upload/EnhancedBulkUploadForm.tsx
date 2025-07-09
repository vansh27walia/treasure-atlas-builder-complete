
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, MapPin, AlertCircle, Loader2, Brain, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import CsvHeaderMapper from './CsvHeaderMapper';

export interface EnhancedBulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  onStepChange: (step: 'upload' | 'mapping' | 'rates' | 'labels' | 'complete') => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>;
}

type UploadStep = 'select' | 'mapping' | 'processing';

const EnhancedBulkUploadForm: React.FC<EnhancedBulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  onStepChange,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [availableAddresses, setAvailableAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log('Loading addresses in EnhancedBulkUploadForm...');
        const addresses = await addressService.getSavedAddresses();
        console.log('Loaded addresses:', addresses);
        setAvailableAddresses(addresses);

        // Find default address or use first available
        const defaultAddress = addresses.find(addr => addr.is_default_from);
        if (defaultAddress) {
          console.log('Found default address:', defaultAddress);
          setSelectedAddressId(defaultAddress.id.toString());
          onPickupAddressSelect(defaultAddress);
        } else if (addresses.length > 0) {
          console.log('Using first available address:', addresses[0]);
          setSelectedAddressId(addresses[0].id.toString());
          onPickupAddressSelect(addresses[0]);
        } else {
          console.log('No addresses available');
          toast.error('No pickup addresses found. Please add a pickup address in Settings first.');
        }

        setAddressesLoaded(true);
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Failed to load pickup addresses. Please check your settings.');
        setAddressesLoaded(true);
      }
    };

    loadAddresses();
  }, [onPickupAddressSelect]);

  const handleAddressChange = (addressId: string) => {
    console.log('Address changed to:', addressId);
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      onPickupAddressSelect(selectedAddress);
    }
  };

  const validateCSVFile = (file: File): boolean => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

    // Check if file is not empty
    if (file.size === 0) {
      toast.error('The CSV file is empty. Please upload a valid CSV file.');
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    console.log('Processing file:', file.name);
    
    if (!validateCSVFile(file)) {
      return false;
    }

    setSelectedFile(file);
    
    // Read CSV content
    try {
      const text = await file.text();
      console.log('CSV content length:', text.length);
      
      if (text.trim().length === 0) {
        toast.error('The CSV file appears to be empty.');
        return false;
      }

      // Basic CSV validation
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row.');
        return false;
      }

      console.log('CSV validation passed, lines:', lines.length);
      setCsvContent(text);
      setCurrentStep('mapping');
      onStepChange('mapping');
      toast.success('CSV file loaded! Now let\'s map the headers with AI assistance.');
      return true;
    } catch (error) {
      console.error('Error reading CSV file:', error);
      toast.error('Error reading CSV file. Please make sure it\'s a valid CSV file.');
      return false;
    }
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
    console.log('Header mapping completed, processing CSV...');
    setCurrentStep('processing');
    onStepChange('rates');
    
    try {
      // Create a temporary file with the converted CSV content
      const blob = new Blob([convertedCsv], { type: 'text/csv' });
      const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });
      
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
      toast.error(errorMessage);
      setCurrentStep('select');
      onStepChange('upload');
    }
  };

  const handleMappingCancel = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setCsvContent('');
    onStepChange('upload');
    toast.info('CSV upload cancelled. You can select a new file.');
  };

  // Render header mapping step
  if (currentStep === 'mapping' && csvContent) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-8">
            <Brain className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Header Mapping</h3>
            <p className="text-gray-600 text-lg">
              Our AI will automatically map your CSV headers to the required shipping format
            </p>
          </div>
          
          <CsvHeaderMapper
            csvContent={csvContent}
            onMappingComplete={handleMappingComplete}
            onCancel={handleMappingCancel}
          />
        </div>
      </div>
    );
  }

  // Render processing step
  if (currentStep === 'processing') {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Shipments</h3>
          <p className="text-gray-600 text-lg mb-6">
            Creating shipments and fetching live rates from carriers...
          </p>
          {progress > 0 && (
            <div className="max-w-md mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render file selection step (default)
  return (
    <div className="min-h-[60vh] flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        {/* Pickup Address Selection */}
        <Card className="p-6">
          <div className="space-y-4">
            <Label htmlFor="pickup-address" className="text-lg font-semibold flex items-center">
              <MapPin className="inline h-5 w-5 mr-2 text-blue-600" />
              Select Pickup Address
            </Label>
            {!addressesLoaded ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">Loading addresses...</span>
              </div>
            ) : availableAddresses.length > 0 ? (
              <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select pickup address" />
                </SelectTrigger>
                <SelectContent>
                  {availableAddresses.map((address) => (
                    <SelectItem key={address.id} value={address.id.toString()}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{address.name}</span>
                        <span className="text-sm text-gray-500">
                          {address.street1}, {address.city}, {address.state} {address.zip}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  No pickup addresses found. Please add a pickup address in Settings first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* File Upload Area */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <Label className="text-lg font-semibold flex items-center justify-center mb-4">
                <FileText className="inline h-5 w-5 mr-2 text-blue-600" />
                Upload Your CSV File
              </Label>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 scale-105'
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
                className="hidden"
              />
              
              <div className="space-y-4">
                {selectedFile ? (
                  <>
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                    <div>
                      <p className="text-lg font-medium text-green-700">
                        {selectedFile.name}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB - Ready for processing
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-16 w-16 text-gray-400" />
                    <div>
                      <p className="text-lg text-gray-600 mb-2">
                        Drag and drop your CSV file here, or{' '}
                        <button
                          type="button"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          browse to select
                        </button>
                      </p>
                      <p className="text-sm text-gray-500">CSV files only, max 10MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedFile && (
              <div className="flex justify-center space-x-4">
                <Button
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  variant="outline"
                  size="lg"
                >
                  Choose Different File
                </Button>
                <Button
                  onClick={() => setCurrentStep('mapping')}
                  disabled={!selectedAddressId || !addressesLoaded}
                  size="lg"
                  className="px-8"
                >
                  <Brain className="mr-2 h-5 w-5" />
                  Continue to AI Mapping
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Info about the process */}
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Smart CSV Processing:</strong> Our AI will analyze your CSV headers and automatically map them to the correct shipping format. No manual field mapping required!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default EnhancedBulkUploadForm;

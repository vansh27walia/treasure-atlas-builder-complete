import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, MapPin, AlertCircle, Loader2, Brain, CheckCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import CsvHeaderMapper from './CsvHeaderMapper';

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>;
}

type UploadStep = 'select' | 'mapping' | 'processing';

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
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
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>('select');

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log('Loading addresses in BulkUploadForm...');
        const addresses = await addressService.getSavedAddresses();
        console.log('Loaded addresses:', addresses);
        setAvailableAddresses(addresses);

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
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return false;
    }

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
    
    try {
      const text = await file.text();
      console.log('CSV content length:', text.length);
      
      if (text.trim().length === 0) {
        toast.error('The CSV file appears to be empty.');
        return false;
      }

      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        toast.error('CSV file must have at least a header row and one data row.');
        return false;
      }

      console.log('CSV validation passed, lines:', lines.length);
      setCsvContent(text);
      setCurrentStep('mapping');
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
    
    try {
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
    }
  };

  const handleMappingCancel = () => {
    setCurrentStep('select');
    setSelectedFile(null);
    setCsvContent('');
    toast.info('CSV upload cancelled. You can select a new file.');
  };

  // Render header mapping step
  if (currentStep === 'mapping' && csvContent) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-6">
            <Brain className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Header Mapping</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our advanced AI is analyzing your CSV headers and automatically mapping them to the correct shipping format. 
            This ensures perfect compatibility with our shipping system.
          </p>
          <div className="flex items-center justify-center mt-6 space-x-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-600">Smart mapping in progress...</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border">
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
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-full mb-6">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Your Shipments</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Creating shipments and fetching live rates from multiple carriers including UPS, USPS, FedEx, and DHL...
          </p>
          
          {progress > 0 && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Creating Shipments</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <span className="text-sm font-medium text-purple-800">Fetching Rates</span>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
              <span className="text-sm font-medium text-gray-600">Finalizing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render file selection step (default)
  return (
    <div className="space-y-8">
      {/* Pickup Address Selection */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="pickup-address" className="text-base font-semibold text-gray-900 mb-2 block">
                Select Pickup Address
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Choose the address where packages will be picked up from
              </p>
              
              {!addressesLoaded ? (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Loading your addresses...</span>
                </div>
              ) : availableAddresses.length > 0 ? (
                <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAddresses.map((address) => (
                      <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          <span className="text-sm text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    <strong>No addresses found.</strong> Please add a pickup address in Settings first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
              ${dragActive
                ? 'border-blue-400 bg-blue-50 scale-105'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }
            `}
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
            
            <div className="space-y-6">
              {selectedFile ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <FileText className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-green-700 mb-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-green-600 mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB - Ready for AI processing
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>File validated successfully</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">
                      Drop your CSV file here
                    </p>
                    <p className="text-gray-600 mb-4">
                      or{' '}
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        browse to choose a file
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-center space-x-4 mt-6">
              <Button
                type="button"
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="outline"
                className="border-2 hover:border-blue-300"
              >
                Choose Different File
              </Button>
              <Button
                onClick={() => setCurrentStep('mapping')}
                disabled={!selectedAddressId || !addressesLoaded}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="mr-2 h-4 w-4" />
                Continue with AI Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info about the process */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <AlertDescription className="text-blue-800">
              <strong className="font-semibold">Smart CSV Processing:</strong> Our AI automatically analyzes and maps your CSV headers to the correct shipping format. No manual field mapping required - just upload and let our intelligence handle the rest!
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default BulkUploadForm;

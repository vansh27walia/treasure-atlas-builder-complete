
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, FileText, MapPin, AlertCircle, Loader2, Brain, CheckCircle, Sparkles, ArrowRight, Zap, FileCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import CsvHeaderMapper from './CsvHeaderMapper';
import AddAddressDialog from './AddAddressDialog';

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
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

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
  }, []);

  const handleAddressChange = (addressId: string) => {
    console.log('Address changed to:', addressId);
    setSelectedAddressId(addressId);
    const selectedAddress = availableAddresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      console.log('Selecting address:', selectedAddress);
      onPickupAddressSelect(selectedAddress);
      toast.success(`Selected pickup address: ${selectedAddress.name || selectedAddress.street1}`);
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
      
     const handleMappingComplete = async (convertedCsv: string) => {
    console.log('Header mapping completed, processing CSV...');
    // REMOVE OR COMMENT OUT THIS LINE TO AVOID AUTOMATIC START:
    // setCurrentStep('processing'); 
    
    // Instead, just set a flag to show the final "Start Upload" button
    // Example: setUploadReady(true); 

    try {
      const blob = new Blob([convertedCsv], { type: 'text/csv' });
      const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });
      
      // The actual upload logic (handleUpload) should be moved
      // to a separate function triggered by a new final "Upload" button.

      // Keep this block only if you want the upload to start immediately:
      /*
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
      }
      */
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

  const handleAreaClick = () => {
    document.getElementById('file-upload')?.click();
  };

  // Enhanced header mapping step - only show the mapper, no upload UI
  if (currentStep === 'mapping' && csvContent) {
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

  // Enhanced processing step
  if (currentStep === 'processing') {
    return (
      <div className="space-y-10">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-green-500 to-teal-600 rounded-full mb-8 shadow-2xl">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Processing Your Shipments</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Creating shipments and fetching live rates from multiple carriers including UPS, USPS, FedEx, and DHL. 
            Our system is comparing thousands of rate options to find you the best deals.
          </p>
          
          {progress > 0 && (
            <div className="max-w-lg mx-auto mb-10">
              <div className="flex justify-between text-lg text-gray-700 mb-3">
                <span className="font-semibold">Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 via-green-500 to-teal-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced file selection step
  return (
    <div className="space-y-8">
      {/* Enhanced Pickup Address Selection */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="pickup-address" className="text-lg font-bold text-gray-900 mb-2 block">
                Select Pickup Address
              </Label>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Choose the address where packages will be picked up from.
              </p>
              
              {!addressesLoaded ? (
                <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-gray-600">Loading addresses...</span>
                </div>
              ) : availableAddresses.length > 0 ? (
                <Select value={selectedAddressId} onValueChange={(val) => {
                  if (val === '__add_new__') {
                    setShowAddAddressModal(true);
                    return;
                  }
                  handleAddressChange(val);
                }}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors p-3">
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {availableAddresses.map((address) => (
                      <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col py-1">
                          <span className="font-semibold text-gray-900">{address.name}</span>
                          <span className="text-sm text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="border-t my-1" />
                    <SelectItem value="__add_new__">
                      <div className="text-blue-700 font-medium">➕ Add new address</div>
                    </SelectItem>
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

      {/* Enhanced File Upload Area - Make entire area clickable */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors shadow-lg">
        <CardContent className="p-8">
          <div
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer
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
            onClick={handleAreaClick}
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
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full shadow-lg">
                    <FileCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-700 mb-2">
                      {selectedFile.name}
                    </p>
                    <p className="text-green-600 mb-4">
                      {(selectedFile.size / 1024).toFixed(1)} KB - Ready for AI processing
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">File validated successfully</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-700 mb-2">
                      Click anywhere to upload CSV file
                    </p>
                    <p className="text-gray-600 mb-4">
                      or drag and drop your file here
                    </p>
                    <p className="text-gray-500">
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleAreaClick();
                }}
                variant="outline"
                className="border-2 hover:border-blue-300 px-4 py-2"
              >
                Choose Different File
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentStep('mapping');
                }}
                disabled={!selectedAddressId || !addressesLoaded}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-6 py-2"
              >
                <Brain className="mr-2 h-4 w-4" />
                Continue with AI Mapping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced info section */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <AlertDescription className="text-blue-800 leading-relaxed">
              <strong className="font-bold">Smart CSV Processing:</strong> Our AI automatically analyzes and maps your CSV headers to the correct shipping format. 
              No manual field mapping required - just upload and let our intelligence handle the complex work!
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Add Address Modal */}
      <AddAddressDialog
        open={showAddAddressModal}
        onOpenChange={setShowAddAddressModal}
        onSaved={async (created) => {
          try {
            const addresses = await addressService.getSavedAddresses();
            setAvailableAddresses(addresses);
            const createdAddress = addresses.find(a => a.id === created.id);
            if (createdAddress) {
              setSelectedAddressId(createdAddress.id.toString());
              onPickupAddressSelect(createdAddress);
            }
            toast.success('Address added');
          } catch (e) {
            console.error(e);
          }
        }}
        isSaving={isSavingAddress}
        setIsSaving={setIsSavingAddress}
      />
    </div>
  );
};

export default BulkUploadForm;

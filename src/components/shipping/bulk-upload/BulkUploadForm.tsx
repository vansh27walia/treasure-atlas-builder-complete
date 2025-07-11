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
      const blob = new Blob([convertedCsv], {
        type: 'text/csv'
      });
      const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', {
        type: 'text/csv'
      });
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

  // Enhanced header mapping step
  if (currentStep === 'mapping' && csvContent) {
    return <div className="space-y-10">
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-full mb-8 shadow-2xl">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">AI Header Mapping in Progress</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Our advanced AI is analyzing your CSV headers and automatically mapping them to the correct shipping format. 
            This intelligent process ensures perfect compatibility with our shipping system and eliminates manual errors.
          </p>
          <div className="flex items-center justify-center mt-8 space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{
              animationDelay: '0.1s'
            }}></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{
              animationDelay: '0.2s'
            }}></div>
            </div>
            <span className="text-lg font-semibold text-purple-600 ml-3">Smart mapping in progress...</span>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <CsvHeaderMapper csvContent={csvContent} onMappingComplete={handleMappingComplete} onCancel={handleMappingCancel} />
        </div>
      </div>;
  }

  // Enhanced processing step
  if (currentStep === 'processing') {
    return <div className="space-y-10">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 via-green-500 to-teal-600 rounded-full mb-8 shadow-2xl">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Processing Your Shipments</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Creating shipments and fetching live rates from multiple carriers including UPS, USPS, FedEx, and DHL. 
            Our system is comparing thousands of rate options to find you the best deals.
          </p>
          
          {progress > 0 && <div className="max-w-lg mx-auto mb-10">
              <div className="flex justify-between text-lg text-gray-700 mb-3">
                <span className="font-semibold">Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                <div className="bg-gradient-to-r from-blue-500 via-green-500 to-teal-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg" style={{
              width: `${progress}%`
            }} />
              </div>
            </div>}
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="flex flex-col items-center space-y-3 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Creating Shipments</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6 bg-purple-50 rounded-xl border border-purple-200">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <span className="text-sm font-semibold text-purple-800">Fetching Rates</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6 bg-green-50 rounded-xl border border-green-200">
              <Zap className="w-8 h-8 text-green-600" />
              <span className="text-sm font-semibold text-green-800">Comparing Prices</span>
            </div>
            <div className="flex flex-col items-center space-y-3 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-2 border-gray-300 rounded-full" />
              <span className="text-sm font-semibold text-gray-600">Finalizing</span>
            </div>
          </div>
        </div>
      </div>;
  }

  // Enhanced file selection step
  return <div className="space-y-10">
      {/* Enhanced Pickup Address Selection */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <MapPin className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="pickup-address" className="text-xl font-bold text-gray-900 mb-3 block">
                Select Pickup Address
              </Label>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Choose the address where packages will be picked up from. This will be used as the origin for all shipments.
              </p>
              
              {!addressesLoaded ? <div className="flex items-center space-x-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-lg text-gray-600">Loading your addresses...</span>
                </div> : availableAddresses.length > 0 ? <Select value={selectedAddressId} onValueChange={handleAddressChange}>
                  <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-blue-300 transition-colors p-4 text-lg">
                    <SelectValue placeholder="Select pickup address" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAddresses.map(address => <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col py-2">
                          <span className="font-semibold text-gray-900 text-lg">{address.name}</span>
                          <span className="text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select> : <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-lg">
                    <strong>No addresses found.</strong> Please add a pickup address in Settings first.
                  </AlertDescription>
                </Alert>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced File Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors shadow-lg">
        <CardContent className="p-10">
          <div className={`
              relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300
              ${dragActive ? 'border-blue-400 bg-blue-50 scale-105' : selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
            `} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <input id="file-upload" type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            
            <div className="space-y-8">
              {selectedFile ? <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-lg">
                    <FileCheck className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 mb-3">
                      {selectedFile.name}
                    </p>
                    <p className="text-lg text-green-600 mb-6">
                      {(selectedFile.size / 1024).toFixed(1)} KB - Ready for AI processing
                    </p>
                    <div className="flex items-center justify-center space-x-3 text-lg text-green-600">
                      <CheckCircle className="w-6 h-6" />
                      <span className="font-semibold">File validated successfully</span>
                    </div>
                  </div>
                </> : <>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full">
                    <Upload className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-700 mb-3">Drop your CSV file here</p>
                    <p className="text-lg text-gray-600 mb-6">
                      or{' '}
                      <button type="button" onClick={() => document.getElementById('file-upload')?.click()} className="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors">
                        browse to choose a file
                      </button>
                    </p>
                    <p className="text-lg text-gray-500">
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                </>}
            </div>
          </div>

          {selectedFile && <div className="flex items-center justify-center space-x-6 mt-8">
              <Button type="button" onClick={() => document.getElementById('file-upload')?.click()} variant="outline" className="border-2 hover:border-blue-300 px-6 py-3" size="lg">
                Choose Different File
              </Button>
              <Button onClick={() => setCurrentStep('mapping')} disabled={!selectedAddressId || !addressesLoaded} className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 px-8 py-3" size="lg">
                <Brain className="mr-3 h-5 w-5" />
                Continue with AI Mapping
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </div>}
        </CardContent>
      </Card>

      {/* Enhanced info section */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <AlertDescription className="text-blue-800 text-lg leading-relaxed">
              <strong className="font-bold text-xl">Smart CSV Processing:</strong> Our AI automatically analyzes and maps your CSV headers to the correct shipping format. 
              No manual field mapping required - just upload and let our intelligence handle the complex work while you focus on your business!
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>;
};
export default BulkUploadForm;
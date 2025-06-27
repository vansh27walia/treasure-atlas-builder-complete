import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileUp, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import SelectAddressDropdown from '../SelectAddressDropdown';
import AddressForm from '../AddressForm';
import CsvHeaderMapper from './CsvHeaderMapper';
import { addressService, SavedAddress } from '@/services/AddressService';

export interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading?: boolean;
  progress?: number;
  handleUpload?: (file: File) => Promise<any>; 
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ 
  onUploadSuccess, 
  onUploadFail,
  onPickupAddressSelect,
  isUploading = false,
  progress = 0,
  handleUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [csvContent, setCsvContent] = useState<string>('');
  const [showHeaderMapper, setShowHeaderMapper] = useState(false);

  // Load saved addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        console.log('Loading addresses in BulkUploadForm...');
        const savedAddresses = await addressService.getSavedAddresses();
        console.log('Loaded addresses:', savedAddresses);
        setAddresses(savedAddresses);
        
        const defaultFromAddress = savedAddresses.find(addr => addr.is_default_from);
        if (defaultFromAddress) {
          console.log('Setting default pickup address:', defaultFromAddress);
          setPickupAddress(defaultFromAddress);
          onPickupAddressSelect(defaultFromAddress);
        } else if (savedAddresses.length > 0) {
          const firstAddress = savedAddresses[0];
          console.log('No default found, using first address:', firstAddress);
          setPickupAddress(firstAddress);
          onPickupAddressSelect(firstAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
        toast.error('Error loading pickup addresses');
      }
    };
    
    loadAddresses();
  }, [onPickupAddressSelect]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      console.log('File selected:', { name: file.name, size: file.size, type: file.type });
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        e.target.value = '';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      
      // Read file content and show header mapper
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        console.log('CSV content loaded, showing header mapper');
        setShowHeaderMapper(true);
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }
      
      setSelectedFile(file);
      
      // Read file content and show header mapper
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        console.log('CSV content loaded from drag/drop, showing header mapper');
        setShowHeaderMapper(true);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMappingComplete = async (convertedCsv: string) => {
    console.log('Header mapping complete, proceeding with converted CSV');
    
    // Create a new File object with the converted CSV content
    const blob = new Blob([convertedCsv], { type: 'text/csv' });
    const convertedFile = new File([blob], selectedFile?.name || 'converted.csv', { type: 'text/csv' });
    
    try {
      if (handleUpload) {
        await handleUpload(convertedFile);
        onUploadSuccess({});
        setShowHeaderMapper(false);
      } else {
        onUploadFail('Upload handler not available');
      }
    } catch (error) {
      console.error('Upload error after mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process converted file';
      onUploadFail(errorMessage);
    }
  };

  const handleMappingCancel = () => {
    setShowHeaderMapper(false);
    setSelectedFile(null);
    setCsvContent('');
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with:', { selectedFile: selectedFile?.name, pickupAddress: pickupAddress?.name });
    
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload');
      return;
    }
    
    if (!pickupAddress) {
      toast.error('Please select a pickup address or add one in Settings');
      return;
    }
    
    try {
      if (handleUpload) {
        console.log('Using provided handleUpload function');
        await handleUpload(selectedFile);
        onUploadSuccess({});
      } else {
        console.log('No handleUpload function provided');
        onUploadFail('Upload handler not available');
      }
    } catch (error) {
      console.error('Upload error in form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      onUploadFail(errorMessage);
    }
  };

  const handleAddressSubmit = async (values: any) => {
    try {
      console.log('Creating new address:', values);
      
      const newAddress = await addressService.createAddress({
        name: values.name || '',
        company: values.company || '',
        street1: values.street1,
        street2: values.street2 || '',
        city: values.city,
        state: values.state,
        zip: values.zip,
        country: values.country || 'US',
        phone: values.phone || '',
        is_default_from: values.is_default_from || false,
        is_default_to: values.is_default_to || false
      }, true);
      
      if (newAddress) {
        toast.success('Address saved successfully');
        
        if (values.is_default_from) {
          await addressService.setDefaultFromAddress(newAddress.id);
        }
        
        setAddresses(prev => [newAddress, ...prev]);
        setPickupAddress(newAddress);
        onPickupAddressSelect(newAddress);
        setShowAddNewAddress(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handlePickupAddressChange = (address: SavedAddress | null) => {
    console.log('Pickup address changed in form:', address);
    setPickupAddress(address);
    onPickupAddressSelect(address);
  };

  // Show header mapper if needed
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pickup Address</h3>
        {showAddNewAddress ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Add New Address</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddNewAddress(false)}
                >
                  Cancel
                </Button>
              </div>
              <AddressForm 
                onSubmit={handleAddressSubmit} 
                buttonText="Save Address" 
                isPickupAddress={true}
                showDefaultOptions={true}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <SelectAddressDropdown
              onAddressSelected={handlePickupAddressChange}
              onAddNew={() => setShowAddNewAddress(true)}
              placeholder="Select a pickup address"
              isPickupAddress={true}
              defaultAddress={pickupAddress}
              className="w-full"
            />
            {!pickupAddress && addresses.length === 0 && (
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>No pickup addresses found.</strong> You need to add a pickup address before uploading CSV files. 
                  Click "Add new address" above or go to Settings to add one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload CSV File</h3>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 hover:bg-blue-50"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          
          <CloudUpload className="h-16 w-16 text-gray-400 mb-4" />
          
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {selectedFile 
                ? `Selected: ${selectedFile.name}` 
                : 'Drag & drop your CSV file here or click to browse'
              }
            </p>
            <p className="text-sm text-gray-500">
              Supported format: CSV (up to 10MB)
            </p>
            {selectedFile && !showHeaderMapper && (
              <p className="text-xs text-green-600 mt-2">
                ✓ File ready for header mapping
              </p>
            )}
          </div>
        </div>
        
        {isUploading && progress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!selectedFile || !pickupAddress || isUploading || showHeaderMapper}
          className="flex items-center gap-2 px-8 py-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {isUploading ? `Uploading... (${progress}%)` : 'Upload and Process'}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;
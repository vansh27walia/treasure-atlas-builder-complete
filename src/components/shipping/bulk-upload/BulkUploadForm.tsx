
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileUp, Loader2, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadResult } from '@/types/shipping';
import SelectAddressDropdown from '../SelectAddressDropdown';
import AddressForm from '../AddressForm';
import { addressService, SavedAddress } from '@/services/AddressService';

export interface BulkUploadFormProps {
  onUploadSuccess: (results: BulkUploadResult) => void;
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
  const [localIsUploading, setLocalIsUploading] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  // Download template function
  const downloadTemplate = () => {
    const csvContent = [
      'name,company,street1,street2,city,state,zip,country,phone,parcel_length,parcel_width,parcel_height,parcel_weight',
      'John Doe,ACME Inc,123 Main St,,San Francisco,CA,94105,US,5551234567,12,8,2,16',
      'Jane Smith,Tech Corp,456 Oak Ave,Suite 200,Los Angeles,CA,90210,US,5559876543,10,6,4,8',
      'Bob Johnson,Global LLC,789 Pine St,,New York,NY,10001,US,5555551234,15,10,6,25'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'bulk_shipping_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  // Load saved addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const savedAddresses = await addressService.getSavedAddresses();
        setAddresses(savedAddresses);
        
        // If there's a default from address, select it
        const defaultFromAddress = savedAddresses.find(addr => addr.is_default_from);
        if (defaultFromAddress) {
          setPickupAddress(defaultFromAddress);
          onPickupAddressSelect(defaultFromAddress);
        }
      } catch (error) {
        console.error('Error loading addresses:', error);
      }
    };
    
    loadAddresses();
  }, [onPickupAddressSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      // Check if it's a CSV file
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        e.target.value = '';
        return;
      }
      
      // Basic size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      
      // Check if it's a CSV file
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      // Basic size check (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 10MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }
    
    setLocalIsUploading(true);
    
    try {
      if (handleUpload) {
        // Use the provided handleUpload function if it exists
        await handleUpload(selectedFile);
      } else {
        // Convert file to base64 to send to edge function
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
          try {
            const base64Data = reader.result?.toString().split(',')[1];
            
            if (!base64Data) {
              throw new Error('Failed to convert file to base64');
            }
            
            const { data, error } = await supabase.functions.invoke('process-bulk-upload', {
              body: { 
                fileName: selectedFile.name,
                fileContent: base64Data,
                pickupAddress: pickupAddress // Include the pickup address for all shipments
              }
            });
            
            if (error) {
              throw new Error(error.message);
            }
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            // Handle success
            toast.success('File uploaded and processed successfully');
            onUploadSuccess(data as BulkUploadResult);
          } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
            toast.error(errorMessage);
            onUploadFail(errorMessage);
          } finally {
            setLocalIsUploading(false);
          }
        };
        
        reader.onerror = () => {
          toast.error('Failed to read file');
          setLocalIsUploading(false);
          onUploadFail('Failed to read file');
        };
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      toast.error(errorMessage);
      onUploadFail(errorMessage);
      setLocalIsUploading(false);
    }
  };

  const handleAddressSubmit = async (values: any) => {
    try {
      // Use encrypted storage for address
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
        
        // Update the local addresses list
        setAddresses(prev => [newAddress, ...prev]);
        
        // Select the newly created address
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
    console.log('Pickup address changed:', address);
    setPickupAddress(address);
    onPickupAddressSelect(address);
  };

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
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  You don't have any saved pickup addresses. Click "Add new address" to create one.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Upload File</h3>
          <Button 
            type="button" 
            onClick={downloadTemplate}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
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
          
          <CloudUpload className="h-12 w-12 text-gray-400 mb-4" />
          
          <div className="text-center">
            <p className="text-sm font-medium mb-1">
              {selectedFile 
                ? selectedFile.name 
                : 'Drag & drop your CSV file here or click to browse'
              }
            </p>
            <p className="text-xs text-gray-500">
              Supported format: CSV (up to 10MB)
            </p>
          </div>
        </div>
        
        {!selectedFile && (
          <div className="text-center">
            <Button 
              type="button" 
              onClick={downloadTemplate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template to Get Started
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!selectedFile || !pickupAddress || isUploading || localIsUploading}
          className="flex items-center gap-2"
        >
          {isUploading || localIsUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {isUploading || localIsUploading ? 'Uploading...' : 'Upload and Process'}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;

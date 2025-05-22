
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, FileUp, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { BulkUploadResult } from '@/types/shipping';
import SelectAddressDropdown from '../SelectAddressDropdown';
import AddressForm from '../AddressForm';
import { addressService, SavedAddress } from '@/services/AddressService';

interface BulkUploadFormProps {
  onUploadSuccess: (results: BulkUploadResult) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ 
  onUploadSuccess, 
  onUploadFail,
  onPickupAddressSelect
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);

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
    
    setIsUploading(true);
    
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
            fileContent: base64Data
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
        setIsUploading(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      setIsUploading(false);
      onUploadFail('Failed to read file');
    };
  };

  const handleAddressSubmit = async (values: any) => {
    try {
      const newAddress = await addressService.createAddress(values);
      
      if (newAddress) {
        toast.success('Address saved successfully');
        
        if (values.is_default_from) {
          await addressService.setDefaultFromAddress(newAddress.id);
        }
        
        onPickupAddressSelect(newAddress);
        setShowAddNewAddress(false);
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
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
              />
            </CardContent>
          </Card>
        ) : (
          <SelectAddressDropdown
            onAddressSelected={onPickupAddressSelect}
            onAddNew={() => setShowAddNewAddress(true)}
            placeholder="Select a pickup address"
            isPickupAddress={true}
          />
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload File</h3>
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
      </div>
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!selectedFile || isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="h-4 w-4" />
          )}
          {isUploading ? 'Uploading...' : 'Upload and Process'}
        </Button>
      </div>
    </form>
  );
};

export default BulkUploadForm;

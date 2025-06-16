
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { SavedAddress } from '@/services/AddressService';
import AddressSelector from '../AddressSelector';
import CsvHeaderMapper from './CsvHeaderMapper';
import { Progress } from '@/components/ui/progress';

interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (csvContent: string, pickupAddress: SavedAddress) => Promise<void>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [pickupAddress, setPickupAddress] = useState<SavedAddress | null>(null);
  const [showMapper, setShowMapper] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      setFile(selectedFile);
      
      // Read the file content and check if mapping is needed
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        
        // Always show the mapper for header validation
        setShowMapper(true);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleMappingComplete = async (convertedCsv: string) => {
    if (!pickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    try {
      setShowMapper(false);
      await handleUpload(convertedCsv, pickupAddress);
    } catch (error) {
      console.error('Upload failed after mapping:', error);
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handlePickupAddressChange = (address: SavedAddress | null) => {
    setPickupAddress(address);
    onPickupAddressSelect(address);
  };

  if (showMapper) {
    return (
      <CsvHeaderMapper
        csvContent={csvContent}
        onMappingComplete={handleMappingComplete}
        onCancel={() => {
          setShowMapper(false);
          setFile(null);
          setCsvContent('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isUploading && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Processing your shipments</h3>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">
            {progress < 100 
              ? `Processing shipments (${progress}%)...` 
              : 'Processing complete! Loading shipment options...'}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="pickup-address" className="text-sm font-medium text-gray-700 mb-2 block">
            Select Pickup Address *
          </Label>
          <AddressSelector
            onAddressSelect={handlePickupAddressChange}
            selectedAddress={pickupAddress}
            placeholder="Choose pickup address for all shipments"
          />
          {!pickupAddress && (
            <p className="text-xs text-orange-600 mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pickup address is required before uploading
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700 mb-2 block">
            Upload CSV File *
          </Label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
            <div className="space-y-1 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a CSV file</span>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV files only, up to 10MB</p>
              {file && (
                <p className="text-sm font-medium text-green-600 mt-2 flex items-center justify-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium text-blue-800 mb-1">📋 Quick Guide:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Any CSV format is supported - our AI will help map headers</li>
            <li>• Or download our template for instant compatibility</li>
            <li>• Pickup address will be used for all shipments in the batch</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadForm;

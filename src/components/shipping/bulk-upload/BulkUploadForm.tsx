
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SavedAddress } from '@/services/AddressService';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { toast } from '@/components/ui/sonner';

interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File, pickupAddress: SavedAddress | null) => Promise<void>;
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
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addresses, isLoading: addressesLoading } = usePickupAddresses();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId) || null;
    onPickupAddressSelect(selectedAddress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!selectedAddressId) {
      toast.error('Please select a pickup address');
      return;
    }

    const selectedAddress = addresses.find(addr => addr.id.toString() === selectedAddressId);
    if (!selectedAddress) {
      toast.error('Selected pickup address not found');
      return;
    }

    try {
      await handleUpload(file, selectedAddress);
      onUploadSuccess({});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadFail(errorMessage);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Pickup Address Selection - Moved to Top */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Pickup Address
          </Label>
          
          {addressesLoading ? (
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="text-gray-600">Loading pickup addresses...</p>
            </div>
          ) : addresses.length > 0 ? (
            <Select value={selectedAddressId} onValueChange={handleAddressChange}>
              <SelectTrigger className="w-full h-14 text-left">
                <SelectValue placeholder="Select pickup address for all shipments" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {address.name || `${address.street1}`}
                      </span>
                      <span className="text-sm text-gray-500">
                        {address.street1}, {address.city}, {address.state} {address.zip}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No pickup addresses found. Please add a pickup address in Settings first.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* File Upload Section */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold text-gray-900">
            Upload CSV File
          </Label>
          
          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
          >
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-xl font-medium text-gray-700">
                {file ? file.name : 'Click to upload CSV file'}
              </p>
              <p className="text-gray-500">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports any CSV format - our AI will help map the headers'}
              </p>
            </div>
          </div>
          
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isUploading || !file || !selectedAddressId}
            className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-3" />
                Process CSV File
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Progress Bar */}
      {isUploading && progress > 0 && (
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Processing Progress</span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600 text-center">
                {progress < 50 
                  ? 'Analyzing CSV structure...' 
                  : progress < 80 
                    ? 'Fetching shipping rates...' 
                    : 'Finalizing shipment details...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUploadForm;

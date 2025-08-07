

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, MapPin, Edit } from 'lucide-react';
import { SavedAddress } from '@/services/AddressService';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { toast } from '@/components/ui/sonner';

interface BulkUploadFormProps {
  onUploadSuccess: (results: any) => void;
  onUploadFail: (error: string) => void;
  onPickupAddressSelect: (address: SavedAddress | null) => void;
  isUploading: boolean;
  progress: number;
  handleUpload: (file: File) => Promise<void>;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({
  onUploadSuccess,
  onUploadFail,
  onPickupAddressSelect,
  isUploading,
  progress,
  handleUpload
}) => {
  const { addresses, isLoading: addressesLoading } = usePickupAddresses();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [selectedPickupAddress, setSelectedPickupAddress] = React.useState<SavedAddress | null>(null);

  React.useEffect(() => {
    if (addresses.length > 0 && !selectedPickupAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default_to) || addresses[0];
      setSelectedPickupAddress(defaultAddress);
      onPickupAddressSelect(defaultAddress);
    }
  }, [addresses, selectedPickupAddress, onPickupAddressSelect]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Please select a valid CSV file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }
    
    if (!selectedPickupAddress) {
      toast.error('Please select a pickup address');
      return;
    }

    try {
      await handleUpload(selectedFile);
      onUploadSuccess('Upload completed successfully');
    } catch (error) {
      onUploadFail(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handlePickupAddressChange = (addressId: string) => {
    const address = addresses.find(addr => addr.id === addressId);
    if (address) {
      setSelectedPickupAddress(address);
      onPickupAddressSelect(address);
    }
  };

  const handleEditPickupAddress = () => {
    // Navigate to settings page to edit pickup addresses
    window.location.href = '/settings';
  };

  const handleDownloadTemplate = () => {
    const csvContent = `customer_name,street1,street2,city,state,zip,country,phone,email,company,parcel_length,parcel_width,parcel_height,parcel_weight,declared_value
John Doe,123 Main St,,New York,NY,10001,US,555-1234,john@email.com,,12,8,6,2.5,100
Jane Smith,456 Oak Ave,Apt 2B,Los Angeles,CA,90210,US,555-5678,jane@email.com,ABC Corp,10,10,8,5.0,200`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bulk_shipping_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Pickup Address Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Select Pickup Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="pickup-address">Pickup Address *</Label>
              <div className="flex items-center space-x-2">
                <Select
                  value={selectedPickupAddress?.id || ''}
                  onValueChange={handlePickupAddressChange}
                  disabled={addressesLoading}
                >
                  <SelectTrigger id="pickup-address" className="flex-1">
                    <SelectValue placeholder={addressesLoading ? "Loading addresses..." : "Select pickup address"} />
                  </SelectTrigger>
                  <SelectContent>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{address.name || 'Unnamed Address'}</span>
                          <span className="text-sm text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditPickupAddress}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {selectedPickupAddress && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm">
                <div className="font-medium">{selectedPickupAddress.name}</div>
                <div>{selectedPickupAddress.street1}</div>
                {selectedPickupAddress.street2 && <div>{selectedPickupAddress.street2}</div>}
                <div>
                  {selectedPickupAddress.city}, {selectedPickupAddress.state} {selectedPickupAddress.zip}
                </div>
                <div>{selectedPickupAddress.country}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload CSV File</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV File *</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {selectedFile && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-gray-500">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              onClick={handleUploadClick}
              disabled={!selectedFile || !selectedPickupAddress || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Uploading...' : 'Upload & Process CSV'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkUploadForm;


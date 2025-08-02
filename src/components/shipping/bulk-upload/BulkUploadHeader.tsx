import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, MapPin, Edit3, Plus } from 'lucide-react';
import { addressService, SavedAddress } from '@/services/AddressService';
import { toast } from '@/components/ui/sonner';
import PickupAddressEditor from './PickupAddressEditor';

interface BulkUploadHeaderProps {
  pickupAddress: SavedAddress | null;
  onPickupAddressChange: (address: SavedAddress | null) => void;
  uploadStatus: string;
  results: any;
}

const BulkUploadHeader: React.FC<BulkUploadHeaderProps> = ({
  pickupAddress,
  onPickupAddressChange,
  uploadStatus,
  results
}) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState<SavedAddress | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setIsLoading(true);
    try {
      const addressList = await addressService.getSavedAddresses();
      setAddresses(addressList);
      
      // Auto-select default address if none selected
      if (!pickupAddress) {
        const defaultAddress = addressList.find(addr => addr.is_default_from);
        if (defaultAddress) {
          onPickupAddressChange(defaultAddress);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      toast.error('Failed to load pickup addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      onPickupAddressChange(selectedAddress);
      toast.success('Pickup address selected');
    }
  };

  const handleEditAddress = () => {
    if (pickupAddress) {
      setSelectedAddressForEdit(pickupAddress);
      setIsEditorOpen(true);
    }
  };

  const handleAddNewAddress = () => {
    setSelectedAddressForEdit(null);
    setIsEditorOpen(true);
  };

  const handleAddressUpdate = (updatedAddress: SavedAddress) => {
    onPickupAddressChange(updatedAddress);
    loadAddresses(); // Refresh the list
  };

  const getStatusBadge = () => {
    if (uploadStatus === 'success') {
      return <Badge className="bg-green-100 text-green-800">Upload Complete</Badge>;
    }
    if (uploadStatus === 'uploading') {
      return <Badge className="bg-blue-100 text-blue-800">Processing...</Badge>;
    }
    if (uploadStatus === 'error') {
      return <Badge className="bg-red-100 text-red-800">Upload Error</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Ready to Upload</Badge>;
  };

  return (
    <>
      <Card className="shadow-lg border-0 bg-gradient-to-r from-white to-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Upload className="h-6 w-6 text-blue-600" />
              Bulk Shipping Upload
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pickup Address Section - Centered */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Pickup Location</h3>
              </div>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              {/* Address Selector - Centered */}
              <div className="space-y-2">
                <Select 
                  value={pickupAddress?.id.toString() || ''} 
                  onValueChange={handleAddressSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300">
                    <SelectValue placeholder={isLoading ? "Loading addresses..." : "Select pickup address"} />
                  </SelectTrigger>
                  <SelectContent className="max-w-md">
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id.toString()}>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {address.name} {address.is_default_from && '(Default)'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {address.street1}, {address.city}, {address.state} {address.zip}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons - Centered */}
              <div className="flex gap-2 justify-center">
                {pickupAddress && (
                  <Button
                    onClick={handleEditAddress}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button
                  onClick={handleAddNewAddress}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>

              {/* Selected Address Display */}
              {pickupAddress && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-center">
                  <div className="font-medium text-gray-900">{pickupAddress.name}</div>
                  {pickupAddress.company && (
                    <div className="text-sm text-gray-600">{pickupAddress.company}</div>
                  )}
                  <div className="text-sm text-gray-600">
                    {pickupAddress.street1}
                    {pickupAddress.street2 && `, ${pickupAddress.street2}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {pickupAddress.city}, {pickupAddress.state} {pickupAddress.zip}
                  </div>
                  {pickupAddress.phone && (
                    <div className="text-sm text-gray-600">{pickupAddress.phone}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Upload Stats */}
          {results && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-blue-600">{results.total || 0}</div>
                <div className="text-sm text-gray-600">Total Shipments</div>
              </div>
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">{results.successful || 0}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ${results.totalCost ? results.totalCost.toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PickupAddressEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        selectedAddress={selectedAddressForEdit}
        onAddressUpdate={handleAddressUpdate}
      />
    </>
  );
};

export default BulkUploadHeader;

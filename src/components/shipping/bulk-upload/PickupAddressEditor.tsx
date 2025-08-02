import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Edit3, Save, Plus } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { addressService, SavedAddress } from '@/services/AddressService';
import { countries } from '@/lib/countries';

interface PickupAddressEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddress: SavedAddress | null;
  onAddressUpdate: (address: SavedAddress) => void;
}

const PickupAddressEditor: React.FC<PickupAddressEditorProps> = ({
  isOpen,
  onClose,
  selectedAddress,
  onAddressUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    is_default_from: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      if (selectedAddress) {
        setFormData({
          name: selectedAddress.name || '',
          company: selectedAddress.company || '',
          street1: selectedAddress.street1 || '',
          street2: selectedAddress.street2 || '',
          city: selectedAddress.city || '',
          state: selectedAddress.state || '',
          zip: selectedAddress.zip || '',
          country: selectedAddress.country || 'US',
          phone: selectedAddress.phone || '',
          is_default_from: selectedAddress.is_default_from || false
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, selectedAddress]);

  const loadAddresses = async () => {
    try {
      const addressList = await addressService.getFromAddresses();
      setAddresses(addressList);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: '',
      is_default_from: false
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.street1 || !formData.city || !formData.state || !formData.zip) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      let savedAddress: SavedAddress;
      
      if (selectedAddress) {
        // Update existing address
        savedAddress = await addressService.updateFromAddress(selectedAddress.id, formData);
        toast.success('Address updated successfully');
      } else {
        // Create new address
        savedAddress = await addressService.saveFromAddress(formData);
        toast.success('Address saved successfully');
      }

      onAddressUpdate(savedAddress);
      onClose();
      loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExisting = (address: SavedAddress) => {
    setFormData({
      name: address.name || '',
      company: address.company || '',
      street1: address.street1 || '',
      street2: address.street2 || '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'US',
      phone: address.phone || '',
      is_default_from: address.is_default_from || false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            {selectedAddress ? 'Edit Pickup Address' : 'Add Pickup Address'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Addresses */}
          {addresses.length > 0 && !selectedAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Select Existing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {addresses.map((address) => (
                    <Button
                      key={address.id}
                      variant="outline"
                      className="justify-start text-left h-auto p-3"
                      onClick={() => handleSelectExisting(address)}
                    >
                      <div>
                        <div className="font-medium">{address.name}</div>
                        <div className="text-xs text-gray-500">
                          {address.street1}, {address.city}, {address.state} {address.zip}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Contact Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Enter company name (optional)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="street1">Street Address *</Label>
            <Input
              id="street1"
              value={formData.street1}
              onChange={(e) => handleInputChange('street1', e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          <div>
            <Label htmlFor="street2">Street Address 2</Label>
            <Input
              id="street2"
              value={formData.street2}
              onChange={(e) => handleInputChange('street2', e.target.value)}
              placeholder="Apartment, suite, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="Enter state"
              />
            </div>
            <div>
              <Label htmlFor="zip">ZIP/Postal Code *</Label>
              <Input
                id="zip"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                placeholder="Enter ZIP code"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country *</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number (optional)"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_default_from"
              checked={formData.is_default_from}
              onChange={(e) => handleInputChange('is_default_from', e.target.checked)}
              className="rounded border-gray-300"
            />
            <Label htmlFor="is_default_from">Set as default pickup address</Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Address
                </>
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PickupAddressEditor;

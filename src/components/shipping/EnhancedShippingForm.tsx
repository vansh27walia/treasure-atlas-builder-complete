import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, User, Phone, Building2, Save, Loader2 } from 'lucide-react';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShippingFormData {
  fromAddress: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  toAddress: {
    name: string;
    company: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  parcel: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
}

const EnhancedShippingForm: React.FC = () => {
  const { addresses, createAddress, isLoading: addressLoading } = usePickupAddresses();
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('');
  const [savePickupAddress, setSavePickupAddress] = useState(false);
  
  const [formData, setFormData] = useState<ShippingFormData>({
    fromAddress: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: ''
    },
    toAddress: {
      name: '',
      company: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      phone: ''
    },
    parcel: {
      weight: 1,
      length: 8,
      width: 6,
      height: 4
    }
  });

  const handleInputChange = (section: 'fromAddress' | 'toAddress' | 'parcel', field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSavedAddressSelect = (addressId: string) => {
    const selectedAddress = addresses.find(addr => addr.id.toString() === addressId);
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        fromAddress: {
          name: selectedAddress.name,
          company: selectedAddress.company || '',
          street1: selectedAddress.street1,
          street2: selectedAddress.street2 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip: selectedAddress.zip,
          country: selectedAddress.country,
          phone: selectedAddress.phone || ''
        }
      }));
      setSelectedPickupAddress(addressId);
    }
  };

  const handleSaveAddress = async () => {
    if (!formData.fromAddress.name || !formData.fromAddress.street1) {
      toast.error('Please fill in required address fields');
      return;
    }

    try {
      await createAddress({
        name: formData.fromAddress.name,
        company: formData.fromAddress.company,
        street1: formData.fromAddress.street1,
        street2: formData.fromAddress.street2,
        city: formData.fromAddress.city,
        state: formData.fromAddress.state,
        zip: formData.fromAddress.zip,
        country: formData.fromAddress.country,
        phone: formData.fromAddress.phone,
        is_default_from: false,
        is_default_to: false
      });
      toast.success('Address saved successfully');
      setSavePickupAddress(false);
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingRates(true);

    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: formData.fromAddress,
          toAddress: formData.toAddress,
          parcel: formData.parcel
        }
      });

      if (error) throw error;

      if (data?.rates) {
        const event = new CustomEvent('easypost-rates-received', {
          detail: {
            rates: data.rates,
            shipmentId: data.shipmentId
          }
        });
        document.dispatchEvent(event);
        toast.success(`Found ${data.rates.length} shipping options!`);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch shipping rates');
    } finally {
      setIsLoadingRates(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* From Address (Pickup) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Pickup Address</h3>
              </div>

              {/* Saved Addresses Dropdown - ONLY for pickup address */}
              {addresses.length > 0 && (
                <div className="space-y-2">
                  <Label>Saved Addresses</Label>
                  <Select value={selectedPickupAddress} onValueChange={handleSavedAddressSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a saved address" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((address) => (
                        <SelectItem key={address.id} value={address.id.toString()}>
                          {address.name} - {address.street1}, {address.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from-name">Name *</Label>
                  <Input
                    id="from-name"
                    value={formData.fromAddress.name}
                    onChange={(e) => handleInputChange('fromAddress', 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="from-company">Company</Label>
                  <Input
                    id="from-company"
                    value={formData.fromAddress.company}
                    onChange={(e) => handleInputChange('fromAddress', 'company', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="from-street1">Street Address *</Label>
                <Input
                  id="from-street1"
                  value={formData.fromAddress.street1}
                  onChange={(e) => handleInputChange('fromAddress', 'street1', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="from-street2">Street Address 2</Label>
                <Input
                  id="from-street2"
                  value={formData.fromAddress.street2}
                  onChange={(e) => handleInputChange('fromAddress', 'street2', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="from-city">City *</Label>
                  <Input
                    id="from-city"
                    value={formData.fromAddress.city}
                    onChange={(e) => handleInputChange('fromAddress', 'city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="from-state">State *</Label>
                  <Input
                    id="from-state"
                    value={formData.fromAddress.state}
                    onChange={(e) => handleInputChange('fromAddress', 'state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="from-zip">ZIP Code *</Label>
                  <Input
                    id="from-zip"
                    value={formData.fromAddress.zip}
                    onChange={(e) => handleInputChange('fromAddress', 'zip', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="from-phone">Phone</Label>
                <Input
                  id="from-phone"
                  value={formData.fromAddress.phone}
                  onChange={(e) => handleInputChange('fromAddress', 'phone', e.target.value)}
                />
              </div>

              {/* Save Address Option - ONLY for pickup address */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="save-pickup-address"
                  checked={savePickupAddress}
                  onChange={(e) => setSavePickupAddress(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="save-pickup-address" className="text-sm">
                  Save this address for future use
                </Label>
              </div>

              {savePickupAddress && (
                <Button
                  type="button"
                  onClick={handleSaveAddress}
                  className="w-full"
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Address
                </Button>
              )}
            </div>

            {/* To Address (Drop-off) - NO saved addresses dropdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Drop-off Address</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="to-name">Name *</Label>
                  <Input
                    id="to-name"
                    value={formData.toAddress.name}
                    onChange={(e) => handleInputChange('toAddress', 'name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="to-company">Company</Label>
                  <Input
                    id="to-company"
                    value={formData.toAddress.company}
                    onChange={(e) => handleInputChange('toAddress', 'company', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="to-street1">Street Address *</Label>
                <Input
                  id="to-street1"
                  value={formData.toAddress.street1}
                  onChange={(e) => handleInputChange('toAddress', 'street1', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="to-street2">Street Address 2</Label>
                <Input
                  id="to-street2"
                  value={formData.toAddress.street2}
                  onChange={(e) => handleInputChange('toAddress', 'street2', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="to-city">City *</Label>
                  <Input
                    id="to-city"
                    value={formData.toAddress.city}
                    onChange={(e) => handleInputChange('toAddress', 'city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="to-state">State *</Label>
                  <Input
                    id="to-state"
                    value={formData.toAddress.state}
                    onChange={(e) => handleInputChange('toAddress', 'state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="to-zip">ZIP Code *</Label>
                  <Input
                    id="to-zip"
                    value={formData.toAddress.zip}
                    onChange={(e) => handleInputChange('toAddress', 'zip', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="to-phone">Phone</Label>
                <Input
                  id="to-phone"
                  value={formData.toAddress.phone}
                  onChange={(e) => handleInputChange('toAddress', 'phone', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Package Details</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.parcel.weight}
                  onChange={(e) => handleInputChange('parcel', 'weight', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="length">Length (in) *</Label>
                <Input
                  id="length"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.parcel.length}
                  onChange={(e) => handleInputChange('parcel', 'length', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in) *</Label>
                <Input
                  id="width"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.parcel.width}
                  onChange={(e) => handleInputChange('parcel', 'width', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in) *</Label>
                <Input
                  id="height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.parcel.height}
                  onChange={(e) => handleInputChange('parcel', 'height', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoadingRates}
          >
            {isLoadingRates ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching Rates...
              </>
            ) : (
              'Get Shipping Rates'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingForm;

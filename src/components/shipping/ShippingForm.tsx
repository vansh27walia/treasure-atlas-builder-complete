
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShippingRates } from '@/hooks/useShippingRates';
import { usePickupAddresses } from '@/hooks/usePickupAddresses';
import PickupAddressSelector from './PickupAddressSelector';
import AddressForm from './AddressForm';
import { SavedAddress } from '@/services/AddressService';

interface ParcelData {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingFormProps {
  onRatesCalculated?: (rates: any[]) => void;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ onRatesCalculated }) => {
  const [fromAddress, setFromAddress] = useState<SavedAddress | null>(null);
  const [showFromAddressForm, setShowFromAddressForm] = useState(false);
  const [toAddress, setToAddress] = useState({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: '',
    company: ''
  });
  const [parcel, setParcel] = useState<ParcelData>({
    length: 0,
    width: 0,
    height: 0,
    weight: 0
  });

  const { fetchRates, isLoading } = useShippingRates();
  const { selectedAddress } = usePickupAddresses();

  useEffect(() => {
    if (selectedAddress) {
      setFromAddress(selectedAddress);
    }
  }, [selectedAddress]);

  const handleCalculateRates = async () => {
    if (!fromAddress || !toAddress.street1 || !toAddress.city || !toAddress.state || !toAddress.zip) {
      alert('Please fill in all required address fields');
      return;
    }

    if (parcel.length <= 0 || parcel.width <= 0 || parcel.height <= 0 || parcel.weight <= 0) {
      alert('Please enter valid parcel dimensions and weight');
      return;
    }

    const rateRequest = {
      fromAddress: {
        name: fromAddress.name || '',
        street1: fromAddress.street1,
        street2: fromAddress.street2 || '',
        city: fromAddress.city,
        state: fromAddress.state,
        zip: fromAddress.zip,
        country: fromAddress.country || 'US',
        phone: fromAddress.phone || '',
        company: fromAddress.company || ''
      },
      toAddress,
      parcel
    };

    await fetchRates(rateRequest);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">From Address</h3>
            <PickupAddressSelector
              selectedAddress={fromAddress}
              onAddressSelected={setFromAddress}
              onAddNew={() => setShowFromAddressForm(true)}
            />
            
            {showFromAddressForm && (
              <AddressForm
                onAddressSaved={(address) => {
                  setFromAddress(address);
                  setShowFromAddressForm(false);
                }}
                onCancel={() => setShowFromAddressForm(false)}
                isPickupAddress={true}
              />
            )}
          </div>

          {/* To Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">To Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to-name">Full Name</Label>
                <Input
                  id="to-name"
                  value={toAddress.name}
                  onChange={(e) => setToAddress(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Recipient name"
                />
              </div>
              <div>
                <Label htmlFor="to-company">Company (Optional)</Label>
                <Input
                  id="to-company"
                  value={toAddress.company}
                  onChange={(e) => setToAddress(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="to-street1">Address Line 1 *</Label>
                <Input
                  id="to-street1"
                  value={toAddress.street1}
                  onChange={(e) => setToAddress(prev => ({ ...prev, street1: e.target.value }))}
                  placeholder="Street address"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="to-street2">Address Line 2</Label>
                <Input
                  id="to-street2"
                  value={toAddress.street2}
                  onChange={(e) => setToAddress(prev => ({ ...prev, street2: e.target.value }))}
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div>
                <Label htmlFor="to-city">City *</Label>
                <Input
                  id="to-city"
                  value={toAddress.city}
                  onChange={(e) => setToAddress(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to-state">State *</Label>
                <Input
                  id="to-state"
                  value={toAddress.state}
                  onChange={(e) => setToAddress(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to-zip">ZIP Code *</Label>
                <Input
                  id="to-zip"
                  value={toAddress.zip}
                  onChange={(e) => setToAddress(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="ZIP code"
                  required
                />
              </div>
              <div>
                <Label htmlFor="to-phone">Phone</Label>
                <Input
                  id="to-phone"
                  value={toAddress.phone}
                  onChange={(e) => setToAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Parcel Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Package Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Length (in) *</Label>
                <Input
                  id="length"
                  type="number"
                  value={parcel.length || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in) *</Label>
                <Input
                  id="width"
                  type="number"
                  value={parcel.width || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in) *</Label>
                <Input
                  id="height"
                  type="number"
                  value={parcel.height || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (oz) *</Label>
                <Input
                  id="weight"
                  type="number"
                  value={parcel.weight || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="0.1"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCalculateRates}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Calculating Rates...' : 'Calculate Shipping Rates'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingForm;

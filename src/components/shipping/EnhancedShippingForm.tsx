
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, MapPin, Search } from 'lucide-react';
import AddressSelector from './AddressSelector';
import { GeneratedAddress } from '@/services/GeocodingService';

interface ParcelData {
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface FormData {
  fromAddress: GeneratedAddress | null;
  toAddress: GeneratedAddress | null;
  parcel: ParcelData;
}

interface EnhancedShippingFormProps {
  onRatesReceived: (data: any) => void;
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({ onRatesReceived }) => {
  const [formData, setFormData] = useState<FormData>({
    fromAddress: null,
    toAddress: null,
    parcel: {
      weight: 1.0,
      length: 12,
      width: 8,
      height: 4,
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleFromAddressSelect = (address: GeneratedAddress) => {
    setFormData(prev => ({ ...prev, fromAddress: address }));
  };

  const handleToAddressSelect = (address: GeneratedAddress) => {
    setFormData(prev => ({ ...prev, toAddress: address }));
  };

  const handleParcelChange = (field: keyof ParcelData, value: string) => {
    setFormData(prev => ({
      ...prev,
      parcel: {
        ...prev.parcel,
        [field]: parseFloat(value),
      },
    }));
  };

  const isFormValid =
    formData.fromAddress !== null &&
    formData.toAddress !== null &&
    formData.parcel.weight > 0 &&
    formData.parcel.length > 0 &&
    formData.parcel.width > 0 &&
    formData.parcel.height > 0;

  const handleGetRates = useCallback(async () => {
    if (!isFormValid) {
      alert('Please fill in all the required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        fromAddress: formData.fromAddress,
        toAddress: formData.toAddress,
        parcel: formData.parcel,
      };

      // Simulate API call (replace with actual API endpoint)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockRates = [
        { id: '1', carrier: 'USPS', service: 'Priority Mail', rate: '8.50', delivery_days: 2 },
        { id: '2', carrier: 'UPS', service: 'Ground', rate: '12.75', delivery_days: 3 },
        { id: '3', carrier: 'FedEx', service: '2-Day', rate: '19.99', delivery_days: 2 },
      ];

      onRatesReceived({ rates: mockRates });
    } catch (error) {
      console.error('Error fetching rates:', error);
      alert('Failed to fetch shipping rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, isFormValid, onRatesReceived]);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-blue-600" />
          Create Shipping Label
        </CardTitle>
        <CardDescription className="text-gray-600">
          Enter package details and addresses to get shipping rates
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Addresses Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* From Address */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              From Address
            </Label>
            <AddressSelector
              type="from"
              onAddressSelect={handleFromAddressSelect}
            />
          </div>

          {/* To Address */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              To Address
            </Label>
            <AddressSelector
              type="to"
              onAddressSelect={handleToAddressSelect}
            />
          </div>
        </div>

        {/* Package Details Section */}
        <div className="space-y-4">
          <Label className="text-base font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Package Details
          </Label>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="text-sm">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                value={formData.parcel.weight}
                onChange={(e) => handleParcelChange('weight', e.target.value)}
                placeholder="1.0"
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="length" className="text-sm">Length (in)</Label>
              <Input
                id="length"
                type="number"
                min="1"
                value={formData.parcel.length}
                onChange={(e) => handleParcelChange('length', e.target.value)}
                placeholder="12"
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="width" className="text-sm">Width (in)</Label>
              <Input
                id="width"
                type="number"
                min="1"
                value={formData.parcel.width}
                onChange={(e) => handleParcelChange('width', e.target.value)}
                placeholder="8"
                className="border-gray-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm">Height (in)</Label>
              <Input
                id="height"
                type="number"
                min="1"
                value={formData.parcel.height}
                onChange={(e) => handleParcelChange('height', e.target.value)}
                placeholder="4"
                className="border-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleGetRates}
          disabled={isLoading || !isFormValid}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
          size="lg"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Getting Rates...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Get Shipping Rates
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EnhancedShippingForm;

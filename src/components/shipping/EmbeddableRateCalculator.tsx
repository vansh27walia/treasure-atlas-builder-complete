
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package, MapPin, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import CarrierLogo from './CarrierLogo';
import { countries } from '@/lib/countries';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
}

const EmbeddableRateCalculator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [formData, setFormData] = useState({
    // From Address
    fromName: '',
    fromCompany: '',
    fromStreet1: '',
    fromStreet2: '',
    fromCity: '',
    fromState: '',
    fromZip: '',
    fromCountry: 'US',
    fromPhone: '',
    // To Address
    toName: '',
    toCompany: '',
    toStreet1: '',
    toStreet2: '',
    toCity: '',
    toState: '',
    toZip: '',
    toCountry: 'US',
    toPhone: '',
    // Package Details
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculateRates = async () => {
    // Validate required fields
    if (!formData.fromStreet1 || !formData.fromCity || !formData.fromZip || 
        !formData.toStreet1 || !formData.toCity || !formData.toZip || !formData.weight) {
      toast.error('Please fill in all required address fields and weight');
      return;
    }

    setIsLoading(true);
    
    try {
      const fromAddress = {
        name: formData.fromName,
        company: formData.fromCompany,
        street1: formData.fromStreet1,
        street2: formData.fromStreet2,
        city: formData.fromCity,
        state: formData.fromState,
        zip: formData.fromZip,
        country: formData.fromCountry,
        phone: formData.fromPhone
      };
      
      const toAddress = {
        name: formData.toName,
        company: formData.toCompany,
        street1: formData.toStreet1,
        street2: formData.toStreet2,
        city: formData.toCity,
        state: formData.toState,
        zip: formData.toZip,
        country: formData.toCountry,
        phone: formData.toPhone
      };
      
      const parcel = {
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || 10,
        width: parseFloat(formData.width) || 8,
        height: parseFloat(formData.height) || 6
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel,
          carriers: ['USPS', 'UPS', 'FedEx', 'DHL']
        }
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to fetch rates. Please try again.');
        return;
      }

      if (data?.rates && data.rates.length > 0) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping options!`);
      } else {
        setRates([]);
        toast.warning('No rates found for the given details.');
      }
    } catch (error) {
      console.error('Rate calculation error:', error);
      toast.error('An error occurred while calculating rates.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Advanced Shipping Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* From Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              From Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="Full Name"
                  value={formData.fromName}
                  onChange={(e) => handleInputChange('fromName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  placeholder="Company Name (Optional)"
                  value={formData.fromCompany}
                  onChange={(e) => handleInputChange('fromCompany', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Address Line 1 *</Label>
                <Input
                  placeholder="Street Address"
                  value={formData.fromStreet1}
                  onChange={(e) => handleInputChange('fromStreet1', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input
                  placeholder="Apartment, Suite, etc. (Optional)"
                  value={formData.fromStreet2}
                  onChange={(e) => handleInputChange('fromStreet2', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  placeholder="City"
                  value={formData.fromCity}
                  onChange={(e) => handleInputChange('fromCity', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>State/Province</Label>
                <Input
                  placeholder="State"
                  value={formData.fromState}
                  onChange={(e) => handleInputChange('fromState', e.target.value)}
                />
              </div>
              <div>
                <Label>ZIP/Postal Code *</Label>
                <Input
                  placeholder="ZIP Code"
                  value={formData.fromZip}
                  onChange={(e) => handleInputChange('fromZip', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={formData.fromCountry} onValueChange={(value) => handleInputChange('fromCountry', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-48 overflow-y-auto">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Phone Number *</Label>
              <Input
                placeholder="Phone Number"
                value={formData.fromPhone}
                onChange={(e) => handleInputChange('fromPhone', e.target.value)}
                required
              />
            </div>
          </div>

          {/* To Address Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              To Address
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="Full Name"
                  value={formData.toName}
                  onChange={(e) => handleInputChange('toName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  placeholder="Company Name (Optional)"
                  value={formData.toCompany}
                  onChange={(e) => handleInputChange('toCompany', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Address Line 1 *</Label>
                <Input
                  placeholder="Street Address"
                  value={formData.toStreet1}
                  onChange={(e) => handleInputChange('toStreet1', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Address Line 2</Label>
                <Input
                  placeholder="Apartment, Suite, etc. (Optional)"
                  value={formData.toStreet2}
                  onChange={(e) => handleInputChange('toStreet2', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  placeholder="City"
                  value={formData.toCity}
                  onChange={(e) => handleInputChange('toCity', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>State/Province</Label>
                <Input
                  placeholder="State"
                  value={formData.toState}
                  onChange={(e) => handleInputChange('toState', e.target.value)}
                />
              </div>
              <div>
                <Label>ZIP/Postal Code *</Label>
                <Input
                  placeholder="ZIP Code"
                  value={formData.toZip}
                  onChange={(e) => handleInputChange('toZip', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Country</Label>
                <Select value={formData.toCountry} onValueChange={(value) => handleInputChange('toCountry', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50 max-h-48 overflow-y-auto">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Phone Number *</Label>
              <Input
                placeholder="Phone Number"
                value={formData.toPhone}
                onChange={(e) => handleInputChange('toPhone', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Package Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-lg font-semibold">
              <Package className="w-4 h-4" />
              Package Details
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Weight (lbs) *</Label>
                <Input
                  placeholder="5.0"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Length (in)</Label>
                <Input
                  placeholder="10"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Width (in)</Label>
                <Input
                  placeholder="8"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Height (in)</Label>
                <Input
                  placeholder="6"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculateRates}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calculating Rates...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Get Shipping Rates
              </>
            )}
          </Button>

          {/* Results */}
          {rates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Available Rates:</h3>
              <div className="space-y-2">
                {rates.map((rate, index) => (
                  <div
                    key={rate.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                      <div>
                        <div className="font-medium">{rate.carrier} {rate.service}</div>
                        <div className="text-sm text-gray-600">
                          Delivery: {rate.delivery_days} day{rate.delivery_days !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-blue-600">
                      ${parseFloat(rate.rate).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmbeddableRateCalculator;

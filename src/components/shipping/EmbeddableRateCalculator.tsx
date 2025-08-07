
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
import { getNames } from 'country-list';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
}

const EmbeddableRateCalculator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [formData, setFormData] = useState({
    fromZip: '',
    toZip: '',
    fromCountry: 'US',
    toCountry: 'US',
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  // Get country names mapping
  const countryNames = getNames();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculateRates = async () => {
    // Validate form
    if (!formData.fromZip || !formData.toZip || !formData.weight) {
      toast.error('Please fill in origin, destination, and weight');
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare addresses
      const fromAddress = {
        zip: formData.fromZip,
        country: formData.fromCountry
      };
      
      const toAddress = {
        zip: formData.toZip,
        country: formData.toCountry
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
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Shipping Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                From
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="90210"
                  value={formData.fromZip}
                  onChange={(e) => handleInputChange('fromZip', e.target.value)}
                  maxLength={5}
                />
                <Select value={formData.fromCountry} onValueChange={(value) => handleInputChange('fromCountry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(countryNames).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                To
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="10001"
                  value={formData.toZip}
                  onChange={(e) => handleInputChange('toZip', e.target.value)}
                  maxLength={5}
                />
                <Select value={formData.toCountry} onValueChange={(value) => handleInputChange('toCountry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(countryNames).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Package Section */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Package Details
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Weight (lbs)</Label>
                <Input
                  placeholder="5.0"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
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

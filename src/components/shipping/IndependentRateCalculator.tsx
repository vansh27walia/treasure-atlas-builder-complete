
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, MapPin, Calculator } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { countries } from '@/lib/countries';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  est_delivery_date: string;
  delivery_days: number;
}

const IndependentRateCalculator = () => {
  const [formData, setFormData] = useState({
    from_zip: '',
    from_country: 'US',
    to_zip: '',
    to_country: 'US',
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateRates = async () => {
    // Validation
    if (!formData.from_zip || !formData.to_zip || !formData.weight || !formData.length || !formData.width || !formData.height) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setShowRates(false);

    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          from_address: {
            zip: formData.from_zip,
            country: formData.from_country
          },
          to_address: {
            zip: formData.to_zip,
            country: formData.to_country
          },
          parcel: {
            weight: parseFloat(formData.weight),
            length: parseFloat(formData.length),
            width: parseFloat(formData.width),
            height: parseFloat(formData.height)
          }
        }
      });

      if (error) {
        console.error('Rate calculation error:', error);
        toast.error('Failed to calculate rates. Please try again.');
        return;
      }

      if (data && data.rates) {
        setRates(data.rates);
        setShowRates(true);
        toast.success(`Found ${data.rates.length} available rates`);
      } else {
        toast.error('No rates available for this shipment');
      }
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error('Failed to calculate rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      from_zip: '',
      from_country: 'US',
      to_zip: '',
      to_country: 'US',
      weight: '',
      length: '',
      width: '',
      height: ''
    });
    setRates([]);
    setShowRates(false);
  };

  return (
    <div className="space-y-8">
      {/* Calculator Form */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6" />
            Shipping Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">From Address</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_country">Country</Label>
                <Select value={formData.from_country} onValueChange={(value) => handleInputChange('from_country', value)}>
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
                <Label htmlFor="from_zip">ZIP/Postal Code *</Label>
                <Input
                  id="from_zip"
                  value={formData.from_zip}
                  onChange={(e) => handleInputChange('from_zip', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>

          {/* To Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">To Address</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to_country">Country</Label>
                <Select value={formData.to_country} onValueChange={(value) => handleInputChange('to_country', value)}>
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
                <Label htmlFor="to_zip">ZIP/Postal Code *</Label>
                <Input
                  id="to_zip"
                  value={formData.to_zip}
                  onChange={(e) => handleInputChange('to_zip', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Package Details</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="0.0"
                />
              </div>
              <div>
                <Label htmlFor="length">Length (in) *</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in) *</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in) *</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={calculateRates}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Get Rates
                </>
              )}
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="px-6"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {showRates && (
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Available Rates ({rates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rates.length > 0 ? (
              <div className="grid gap-4">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="font-medium">
                          {rate.carrier}
                        </Badge>
                        <span className="font-medium text-gray-900">{rate.service}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Estimated delivery: {rate.delivery_days} business days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600">${rate.rate}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No rates available for this shipment</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndependentRateCalculator;

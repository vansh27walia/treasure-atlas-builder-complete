
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

// Full list of countries
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'MC', name: 'Monaco' },
  { code: 'SM', name: 'San Marino' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'AD', name: 'Andorra' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'GY', name: 'Guyana' },
  { code: 'SR', name: 'Suriname' },
  { code: 'GF', name: 'French Guiana' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'LY', name: 'Libya' },
  { code: 'SD', name: 'Sudan' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'DJ', name: 'Djibouti' },
  { code: 'SO', name: 'Somalia' },
  { code: 'ER', name: 'Eritrea' },
  { code: 'SS', name: 'South Sudan' },
  { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'GQ', name: 'Equatorial Guinea' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Republic of the Congo' },
  { code: 'CD', name: 'Democratic Republic of the Congo' },
  { code: 'AO', name: 'Angola' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'BW', name: 'Botswana' },
  { code: 'NA', name: 'Namibia' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'KM', name: 'Comoros' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'RE', name: 'Réunion' }
];

interface RateResult {
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
}

const RateCalculator: React.FC = () => {
  const [fromAddress, setFromAddress] = useState({
    zip: '',
    country: 'US'
  });
  const [toAddress, setToAddress] = useState({
    zip: '',
    country: 'US'
  });
  const [packageDetails, setPackageDetails] = useState({
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculateRates = async () => {
    if (!fromAddress.zip || !toAddress.zip || !packageDetails.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCalculating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: {
            zip: fromAddress.zip,
            country: fromAddress.country
          },
          toAddress: {
            zip: toAddress.zip,
            country: toAddress.country
          },
          parcel: {
            weight: parseFloat(packageDetails.weight),
            length: parseFloat(packageDetails.length) || 1,
            width: parseFloat(packageDetails.width) || 1,
            height: parseFloat(packageDetails.height) || 1
          }
        }
      });

      if (error) {
        throw error;
      }

      setRates(data.rates || []);
      toast.success('Rates calculated successfully!');
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error('Failed to calculate rates');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Shipping Rate Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">From Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-zip">ZIP Code *</Label>
                <Input
                  id="from-zip"
                  value={fromAddress.zip}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <Label htmlFor="from-country">Country *</Label>
                <Select
                  value={fromAddress.country}
                  onValueChange={(value) => setFromAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger id="from-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* To Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">To Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to-zip">ZIP Code *</Label>
                <Input
                  id="to-zip"
                  value={toAddress.zip}
                  onChange={(e) => setToAddress(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <Label htmlFor="to-country">Country *</Label>
                <Select
                  value={toAddress.country}
                  onValueChange={(value) => setToAddress(prev => ({ ...prev, country: value }))}
                >
                  <SelectTrigger id="to-country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Package Details</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  value={packageDetails.weight}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="Weight"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={packageDetails.length}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, length: e.target.value }))}
                  placeholder="Length"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={packageDetails.width}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, width: e.target.value }))}
                  placeholder="Width"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={packageDetails.height}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, height: e.target.value }))}
                  placeholder="Height"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculateRates}
            disabled={isCalculating}
            className="w-full"
            size="lg"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Rates'}
          </Button>

          {/* Results */}
          {rates.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Rates</h3>
              <div className="grid gap-4">
                {rates.map((rate, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{rate.carrier}</div>
                        <div className="text-sm text-gray-600">{rate.service}</div>
                        <div className="text-sm text-gray-500">
                          {rate.delivery_days} business days
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        ${rate.rate}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RateCalculator;

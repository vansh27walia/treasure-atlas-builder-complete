
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package, MapPin, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from './CarrierLogo';
import { standardizeCarrierName } from '@/utils/carrierUtils';

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 10, etc.

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
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'IS', name: 'Iceland' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'MC', name: 'Monaco' },
  { code: 'SM', name: 'San Marino' },
  { code: 'VA', name: 'Vatican City' },
  { code: 'AD', name: 'Andorra' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'BY', name: 'Belarus' },
  { code: 'MD', name: 'Moldova' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'MO', name: 'Macau' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Peru' },
  { code: 'CO', name: 'Colombia' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'GY', name: 'Guyana' },
  { code: 'SR', name: 'Suriname' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'LY', name: 'Libya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'BW', name: 'Botswana' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'MW', name: 'Malawi' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'MG', name: 'Madagascar' },
  { code: 'MU', name: 'Mauritius' },
  { code: 'SC', name: 'Seychelles' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'SY', name: 'Syria' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IR', name: 'Iran' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'MV', name: 'Maldives' },
  { code: 'NP', name: 'Nepal' },
  { code: 'BT', name: 'Bhutan' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'KH', name: 'Cambodia' },
  { code: 'LA', name: 'Laos' },
  { code: 'BN', name: 'Brunei' },
  { code: 'TL', name: 'East Timor' },
  { code: 'FJ', name: 'Fiji' },
  { code: 'PG', name: 'Papua New Guinea' },
  { code: 'SB', name: 'Solomon Islands' },
  { code: 'VU', name: 'Vanuatu' },
  { code: 'NC', name: 'New Caledonia' },
  { code: 'PF', name: 'French Polynesia' },
  { code: 'WS', name: 'Samoa' },
  { code: 'TO', name: 'Tonga' },
  { code: 'TV', name: 'Tuvalu' },
  { code: 'KI', name: 'Kiribati' },
  { code: 'NR', name: 'Nauru' },
  { code: 'PW', name: 'Palau' },
  { code: 'FM', name: 'Federated States of Micronesia' },
  { code: 'MH', name: 'Marshall Islands' }
].sort((a, b) => a.name.localeCompare(b.name));

interface RateCalculatorProps {
  onRatesCalculated?: (rates: any[]) => void;
}

const RateCalculator: React.FC<RateCalculatorProps> = ({ onRatesCalculated }) => {
  const [fromAddress, setFromAddress] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });

  const [toAddress, setToAddress] = useState({
    name: '',
    company: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    phone: ''
  });

  const [parcel, setParcel] = useState({
    length: 12,
    width: 8,
    height: 4,
    weight: 16
  });

  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Apply configurable markup to rates
  const applyRateMarkup = (originalRate: number): number => {
    const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
    const finalRate = originalRate + markupAmount;
    
    console.log(`Rate markup applied: Original: $${originalRate.toFixed(2)}, Markup (${RATE_MARKUP_PERCENTAGE}%): $${markupAmount.toFixed(2)}, Final: $${finalRate.toFixed(2)}`);
    
    return finalRate;
  };

  const calculateRates = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel
        }
      });

      if (error) {
        toast.error('Failed to calculate shipping rates');
        console.error('Rate calculation error:', error);
        return;
      }

      if (data && data.rates) {
        // Apply markup to rates
        const processedRates = data.rates.map(rate => {
          const originalRate = parseFloat(rate.rate);
          const markedUpRate = applyRateMarkup(originalRate);
          
          return {
            ...rate,
            rate: markedUpRate.toFixed(2),
            original_rate: originalRate.toFixed(2),
            markup_percentage: RATE_MARKUP_PERCENTAGE,
            carrier: standardizeCarrierName(rate.carrier)
          };
        });

        setRates(processedRates);
        
        if (onRatesCalculated) {
          onRatesCalculated(processedRates);
        }
        
        toast.success(`Found ${processedRates.length} shipping rates with ${RATE_MARKUP_PERCENTAGE}% markup`);
      }
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error('An error occurred while calculating rates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Shipping Rate Calculator</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>From Address</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-name">Name</Label>
                <Input
                  id="from-name"
                  value={fromAddress.name}
                  onChange={(e) => setFromAddress({...fromAddress, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="from-company">Company</Label>
                <Input
                  id="from-company"
                  value={fromAddress.company}
                  onChange={(e) => setFromAddress({...fromAddress, company: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="from-street1">Street Address</Label>
              <Input
                id="from-street1"
                value={fromAddress.street1}
                onChange={(e) => setFromAddress({...fromAddress, street1: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="from-street2">Apartment/Unit</Label>
              <Input
                id="from-street2"
                value={fromAddress.street2}
                onChange={(e) => setFromAddress({...fromAddress, street2: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="from-city">City</Label>
                <Input
                  id="from-city"
                  value={fromAddress.city}
                  onChange={(e) => setFromAddress({...fromAddress, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="from-state">State/Province</Label>
                <Input
                  id="from-state"
                  value={fromAddress.state}
                  onChange={(e) => setFromAddress({...fromAddress, state: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="from-zip">ZIP/Postal Code</Label>
                <Input
                  id="from-zip"
                  value={fromAddress.zip}
                  onChange={(e) => setFromAddress({...fromAddress, zip: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="from-country">Country</Label>
                <Select value={fromAddress.country} onValueChange={(value) => setFromAddress({...fromAddress, country: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>To Address</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="to-name">Name</Label>
                <Input
                  id="to-name"
                  value={toAddress.name}
                  onChange={(e) => setToAddress({...toAddress, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="to-company">Company</Label>
                <Input
                  id="to-company"
                  value={toAddress.company}
                  onChange={(e) => setToAddress({...toAddress, company: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="to-street1">Street Address</Label>
              <Input
                id="to-street1"
                value={toAddress.street1}
                onChange={(e) => setToAddress({...toAddress, street1: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="to-street2">Apartment/Unit</Label>
              <Input
                id="to-street2"
                value={toAddress.street2}
                onChange={(e) => setToAddress({...toAddress, street2: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="to-city">City</Label>
                <Input
                  id="to-city"
                  value={toAddress.city}
                  onChange={(e) => setToAddress({...toAddress, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="to-state">State/Province</Label>
                <Input
                  id="to-state"
                  value={toAddress.state}
                  onChange={(e) => setToAddress({...toAddress, state: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="to-zip">ZIP/Postal Code</Label>
                <Input
                  id="to-zip"
                  value={toAddress.zip}
                  onChange={(e) => setToAddress({...toAddress, zip: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="to-country">Country</Label>
                <Select value={toAddress.country} onValueChange={(value) => setToAddress({...toAddress, country: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
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
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Package Details</span>
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  value={parcel.length}
                  onChange={(e) => setParcel({...parcel, length: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  value={parcel.width}
                  onChange={(e) => setParcel({...parcel, width: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  value={parcel.height}
                  onChange={(e) => setParcel({...parcel, height: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={parcel.weight}
                  onChange={(e) => setParcel({...parcel, weight: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={calculateRates} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Calculating...' : 'Calculate Rates'}
          </Button>
        </CardContent>
      </Card>

      {/* Rates Display */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Available Rates (with {RATE_MARKUP_PERCENTAGE}% markup)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rates.map((rate, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <CarrierLogo carrier={rate.carrier} className="w-10 h-10" />
                    <div>
                      <div className="font-semibold">{rate.carrier}</div>
                      <div className="text-sm text-gray-600">{rate.service}</div>
                      <div className="text-sm text-blue-600">
                        {rate.delivery_days} business days
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      ${rate.rate}
                    </div>
                    {rate.original_rate && (
                      <div className="text-sm text-gray-500">
                        Original: <span className="line-through">${rate.original_rate}</span>
                      </div>
                    )}
                    <div className="text-xs text-green-600">
                      {RATE_MARKUP_PERCENTAGE}% markup included
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateCalculator;

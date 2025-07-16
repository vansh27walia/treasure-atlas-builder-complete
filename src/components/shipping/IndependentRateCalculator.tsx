
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Package, ArrowRight, Globe } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  insurance_cost?: number;
  total_cost?: number;
}

const IndependentRateCalculator: React.FC = () => {
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destCountry, setDestCountry] = useState('US');
  const [shippingType, setShippingType] = useState('');
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    weight: ''
  });
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<RateResult | null>(null);

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    { code: 'MX', name: 'Mexico' },
  ];

  const shippingTypes = [{
    value: 'usps_flat_rate',
    label: 'USPS Flat Rate'
  }, {
    value: 'box',
    label: 'Box'
  }, {
    value: 'envelope',
    label: 'Envelope'
  }, {
    value: 'fedex',
    label: 'FedEx'
  }, {
    value: 'ups',
    label: 'UPS'
  }, {
    value: 'dhl',
    label: 'DHL'
  }];

  const flatRateBoxes = ['Small Flat Rate Box', 'Medium Flat Rate Box', 'Large Flat Rate Box', 'Regional Rate Box A', 'Regional Rate Box B'];

  const isInternational = originCountry !== destCountry;

  const handleShippingTypeChange = (value: string) => {
    setShippingType(value);
    setDimensions({
      length: '',
      width: '',
      height: '',
      weight: ''
    });
  };

  const renderDynamicInputs = () => {
    if (shippingType === 'usps_flat_rate') {
      return (
        <div className="space-y-3">
          <Label>Select Flat Rate Box</Label>
          <Select onValueChange={(value) => setDimensions({ ...dimensions, weight: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose box type" />
            </SelectTrigger>
            <SelectContent>
              {flatRateBoxes.map((box) => (
                <SelectItem key={box} value={box}>{box}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (shippingType === 'envelope') {
      return (
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Length (in)</Label>
            <Input 
              value={dimensions.length} 
              onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })} 
              placeholder="0" 
            />
          </div>
          <div>
            <Label>Width (in)</Label>
            <Input 
              value={dimensions.width} 
              onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} 
              placeholder="0" 
            />
          </div>
          <div>
            <Label>Height (in)</Label>
            <Input 
              value={dimensions.height} 
              onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} 
              placeholder="0" 
            />
          </div>
        </div>
      );
    }

    if (['box', 'fedex', 'ups', 'dhl'].includes(shippingType)) {
      return (
        <div className="space-y-3">
          <div>
            <Label>Weight (lbs)</Label>
            <Input 
              value={dimensions.weight} 
              onChange={(e) => setDimensions({ ...dimensions, weight: e.target.value })} 
              placeholder="0" 
            />
          </div>
          {shippingType === 'box' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Length (in)</Label>
                <Input 
                  value={dimensions.length} 
                  onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input 
                  value={dimensions.width} 
                  onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input 
                  value={dimensions.height} 
                  onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })} 
                  placeholder="0" 
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const fetchRates = async () => {
    if (!originZip || !destZip || !shippingType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Use Google Maps API to get full addresses
      const { data: googleApiData } = await supabase.functions.invoke('get-google-api-key');
      if (!googleApiData?.apiKey) {
        toast.error('Google Maps API not configured');
        return;
      }

      // Geocode origin zip with country
      const originQuery = `${originZip}, ${countries.find(c => c.code === originCountry)?.name || originCountry}`;
      const originResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(originQuery)}&key=${googleApiData.apiKey}`);
      const originData = await originResponse.json();

      // Geocode destination zip with country
      const destQuery = `${destZip}, ${countries.find(c => c.code === destCountry)?.name || destCountry}`;
      const destResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destQuery)}&key=${googleApiData.apiKey}`);
      const destData = await destResponse.json();

      if (!originData.results[0] || !destData.results[0]) {
        toast.error('Invalid zip codes or addresses');
        return;
      }

      // Extract address components
      const parseGoogleAddress = (result: any, country: string) => {
        const components = result.address_components;
        return {
          name: 'Rate Calculator',
          street1: `${result.formatted_address.split(',')[0]}`,
          street2: '',
          city: components.find((c: any) => c.types.includes('locality'))?.long_name || 'Unknown',
          state: components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name || '',
          zip: components.find((c: any) => c.types.includes('postal_code'))?.long_name || '',
          country: country,
          phone: '',
        };
      };

      const fromAddress = parseGoogleAddress(originData.results[0], originCountry);
      const toAddress = parseGoogleAddress(destData.results[0], destCountry);

      // Prepare payload for rate fetching
      const payload = {
        fromAddress,
        toAddress,
        parcel: {
          length: parseFloat(dimensions.length) || 10,
          width: parseFloat(dimensions.width) || 10,
          height: parseFloat(dimensions.height) || 5,
          weight: (parseFloat(dimensions.weight) || 1) * 16, // Convert to ounces
        },
        carriers: ['usps', 'ups', 'fedex', 'dhl'],
        options: {},
        customs_info: isInternational ? null : undefined, // Will need customs for international
        insurance_info: null
      };

      console.log('Fetching rates with payload:', payload);

      // Fetch rates using the same endpoint as the main shipping form
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.rates && Array.isArray(data.rates)) {
        // Apply the same rate processing as the main shipping flow
        const processedRates = data.rates.map(rate => ({
          ...rate,
          insurance_cost: 0,
          total_cost: parseFloat(rate.rate)
        }));
        
        setRates(processedRates);
        toast.success(`Found ${processedRates.length} ${isInternational ? 'international' : 'domestic'} shipping rates`);
      } else {
        setRates([]);
        toast.warning('No rates found for the specified route');
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to fetch rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipThis = (rate: RateResult) => {
    // Store the rate data for the main shipping workflow
    const calculatorData = {
      originZip,
      destZip,
      originCountry,
      destCountry,
      shippingType,
      dimensions,
      selectedRate: rate,
      isInternational,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    sessionStorage.setItem('transferToShipping', 'true');
    
    toast.success(`Package data saved! ${isInternational ? 'International customs documentation will be required.' : 'Go to Create Label to complete shipping.'}`);

    // Dispatch event to notify other components
    document.dispatchEvent(new CustomEvent('calculator-ship-selected', {
      detail: calculatorData
    }));
  };

  // Calculate hyper-discounted rate (20% off)
  const getHyperDiscountedRate = (rate: number) => {
    return rate * 0.8;
  };

  // Calculate inflated rate (15% markup)
  const getInflatedRate = (rate: number) => {
    return rate * 1.15;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {isInternational ? 'International' : 'Domestic'} Rate Calculator
          {isInternational && <Globe className="h-4 w-4 text-blue-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Origin Zip/Postal Code</Label>
            <Input
              value={originZip}
              onChange={(e) => setOriginZip(e.target.value)}
              placeholder="10001"
            />
            <Select value={originCountry} onValueChange={setOriginCountry}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destination Zip/Postal Code</Label>
            <Input
              value={destZip}
              onChange={(e) => setDestZip(e.target.value)}
              placeholder="90210"
            />
            <Select value={destCountry} onValueChange={setDestCountry}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* International Notice */}
        {isInternational && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">
                International shipping detected - customs documentation will be required
              </span>
            </div>
          </div>
        )}

        {/* Shipping Type Selector */}
        <div>
          <Label>Shipping Type</Label>
          <Select value={shippingType} onValueChange={handleShippingTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select shipping type" />
            </SelectTrigger>
            <SelectContent>
              {shippingTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Input Fields */}
        {renderDynamicInputs()}

        {/* Fetch Rates Button */}
        <Button 
          onClick={fetchRates} 
          disabled={isLoading || !originZip || !destZip || !shippingType}
          className="w-full"
        >
          {isLoading ? 'Fetching Rates...' : `Get ${isInternational ? 'International' : 'Domestic'} Rates`}
        </Button>

        {/* Rates Display */}
        {rates.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold">Available {isInternational ? 'International' : 'Domestic'} Rates</h3>
            {rates.map((rate) => {
              const baseRate = parseFloat(rate.rate);
              const inflatedRate = getInflatedRate(baseRate);
              const hyperDiscountedRate = getHyperDiscountedRate(baseRate);

              return (
                <div 
                  key={rate.id} 
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{rate.carrier} - {rate.service}</div>
                      <div className="text-sm text-gray-600">
                        {rate.delivery_days} business days
                      </div>
                    </div>
                    <div className="text-right">
                      {/* Show pricing tiers */}
                      <div className="space-y-1 mb-2">
                        <div className="text-xs text-gray-500 line-through">
                          Regular: ${inflatedRate.toFixed(2)}
                        </div>
                        <div className="text-sm text-orange-600">
                          Our Price: ${baseRate.toFixed(2)}
                        </div>
                        <div className="text-xs text-green-600 font-semibold">
                          Hyper Discount: ${hyperDiscountedRate.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-bold text-lg">
                        {rate.currency} {baseRate.toFixed(2)}
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleShipThis(rate)}
                        className="mt-2"
                      >
                        Ship This Package
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndependentRateCalculator;

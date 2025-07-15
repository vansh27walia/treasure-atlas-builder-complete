
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, MapPin, Package, ArrowRight } from 'lucide-react';
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
}

const IndependentRateCalculator: React.FC = () => {
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  const [country, setCountry] = useState('US');
  const [shippingType, setShippingType] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '', weight: '' });
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRate, setSelectedRate] = useState<RateResult | null>(null);

  const shippingTypes = [
    { value: 'usps_flat_rate', label: 'USPS Flat Rate' },
    { value: 'box', label: 'Box' },
    { value: 'envelope', label: 'Envelope' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'ups', label: 'UPS' },
    { value: 'dhl', label: 'DHL' }
  ];

  const flatRateBoxes = [
    'Small Flat Rate Box',
    'Medium Flat Rate Box',
    'Large Flat Rate Box',
    'Regional Rate Box A',  
    'Regional Rate Box B'
  ];

  const handleShippingTypeChange = (value: string) => {
    setShippingType(value);
    setDimensions({ length: '', width: '', height: '', weight: '' });
  };

  const renderDynamicInputs = () => {
    if (shippingType === 'usps_flat_rate') {
      return (
        <div className="space-y-3">
          <Label>Select Flat Rate Box</Label>
          <Select onValueChange={(value) => setDimensions({...dimensions, weight: value})}>
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
              onChange={(e) => setDimensions({...dimensions, length: e.target.value})}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Width (in)</Label>
            <Input
              value={dimensions.width}
              onChange={(e) => setDimensions({...dimensions, width: e.target.value})}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Height (in)</Label>
            <Input
              value={dimensions.height}
              onChange={(e) => setDimensions({...dimensions, height: e.target.value})}
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
              onChange={(e) => setDimensions({...dimensions, weight: e.target.value})}
              placeholder="0"
            />
          </div>
          {shippingType === 'box' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Length (in)</Label>
                <Input
                  value={dimensions.length}
                  onChange={(e) => setDimensions({...dimensions, length: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input
                  value={dimensions.width}
                  onChange={(e) => setDimensions({...dimensions, width: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input
                  value={dimensions.height}
                  onChange={(e) => setDimensions({...dimensions, height: e.target.value})}
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
      // Use Google Maps API to get addresses
      const { data: googleApiData } = await supabase.functions.invoke('get-google-api-key');
      
      if (!googleApiData?.apiKey) {
        toast.error('Google Maps API not configured');
        return;
      }

      // Geocode origin zip
      const originResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${originZip}&key=${googleApiData.apiKey}`
      );
      const originData = await originResponse.json();
      
      // Geocode destination zip
      const destResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${destZip}&key=${googleApiData.apiKey}`
      );
      const destData = await destResponse.json();

      if (!originData.results[0] || !destData.results[0]) {
        toast.error('Invalid zip codes');
        return;
      }

      // Extract address components
      const parseGoogleAddress = (result: any) => {
        const components = result.address_components;
        return {
          street1: `${result.formatted_address.split(',')[0]}`,
          city: components.find((c: any) => c.types.includes('locality'))?.long_name || '',
          state: components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name || '',
          zip: components.find((c: any) => c.types.includes('postal_code'))?.long_name || '',
          country: country
        };
      };

      const fromAddress = parseGoogleAddress(originData.results[0]);
      const toAddress = parseGoogleAddress(destData.results[0]);

      // Prepare payload for rate fetching
      const payload = {
        fromAddress: {
          name: 'Calculator User',
          ...fromAddress
        },
        toAddress: {
          name: 'Recipient',
          ...toAddress
        },
        parcel: {
          length: parseFloat(dimensions.length) || 10,
          width: parseFloat(dimensions.width) || 10,
          height: parseFloat(dimensions.height) || 5,
          weight: parseFloat(dimensions.weight) || 1
        }
      };

      // Fetch rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      setRates(data.rates || []);
      toast.success('Rates fetched successfully');

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
      country,
      shippingType,
      dimensions,
      selectedRate: rate,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    sessionStorage.setItem('transferToShipping', 'true');
    
    toast.success('Package data saved! Go to Create Label to complete shipping.');
    
    // Dispatch event to notify other components
    document.dispatchEvent(new CustomEvent('calculator-ship-selected', { 
      detail: calculatorData 
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-blue-600" />
          Rate Calculator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Origin & Destination */}
        <div className="space-y-3">
          <div>
            <Label className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Origin Zip Code
            </Label>
            <Input
              value={originZip}
              onChange={(e) => setOriginZip(e.target.value)}
              placeholder="Enter zip code"
            />
          </div>
          
          <div>
            <Label>Destination Zip Code</Label>
            <Input
              value={destZip}
              onChange={(e) => setDestZip(e.target.value)}
              placeholder="Enter zip code"
            />
          </div>

          <div>
            <Label>Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="MX">Mexico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shipping Type */}
        <div>
          <Label className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            Shipping Type
          </Label>
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

        {/* Dynamic Inputs */}
        {renderDynamicInputs()}

        {/* Get Rates Button */}
        <Button 
          onClick={fetchRates}
          disabled={!originZip || !destZip || !shippingType || isLoading}
          className="w-full"
        >
          {isLoading ? 'Fetching Rates...' : 'Get Rates'}
        </Button>

        {/* Rates Display */}
        {rates.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="font-semibold">Available Rates:</h4>
            {rates.map((rate) => (
              <div key={rate.id} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{rate.carrier.toUpperCase()}</div>
                    <div className="text-sm text-gray-600">{rate.service}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${rate.rate}</div>
                    <div className="text-sm text-gray-600">{rate.delivery_days} days</div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleShipThis(rate)}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Ship This Package
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndependentRateCalculator;

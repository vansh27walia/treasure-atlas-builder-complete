
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Search, Loader2, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  discount?: number;
}

const packageTypes = [
  { value: 'box', label: 'Box', requiresHeight: true },
  { value: 'envelope', label: 'Envelope', requiresHeight: false },
  { value: 'FlatRateEnvelope', label: 'USPS - Flat Rate Envelope', requiresHeight: false },
  { value: 'SmallFlatRateBox', label: 'USPS - Small Flat Rate Box', requiresHeight: false },
  { value: 'MediumFlatRateBox', label: 'USPS - Medium Flat Rate Box', requiresHeight: false },
  { value: 'LargeFlatRateBox', label: 'USPS - Large Flat Rate Box', requiresHeight: false },
  { value: 'UPSLetter', label: 'UPS - Letter', requiresHeight: false },
  { value: 'UPSExpressBox', label: 'UPS - Express Box', requiresHeight: false },
  { value: 'FedExEnvelope', label: 'FedEx - Envelope', requiresHeight: false },
  { value: 'FedExBox', label: 'FedEx - Box', requiresHeight: false },
  { value: 'DHLExpressEnvelope', label: 'DHL - Express Envelope', requiresHeight: false },
];

const RateCalculator: React.FC = () => {
  const [fromZip, setFromZip] = useState('');
  const [fromCountry, setFromCountry] = useState('US');
  const [toZip, setToZip] = useState('');
  const [toCountry, setToCountry] = useState('US');
  const [packageType, setPackageType] = useState('box');
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    weight: ''
  });
  const [weightUnit, setWeightUnit] = useState('lb');
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [resolvedAddresses, setResolvedAddresses] = useState<any>({});

  const selectedPackage = packageTypes.find(p => p.value === packageType);
  const showHeight = selectedPackage?.requiresHeight || false;
  const isCustomPackage = ['box', 'envelope'].includes(packageType);

  const resolveAddress = async (zip: string, country: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zip},${country}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to resolve address');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.address_components;
        
        const getComponent = (types: string[]) => {
          const component = components.find((c: any) => 
            types.some(type => c.types.includes(type))
          );
          return component?.long_name || component?.short_name || '';
        };
        
        return {
          street1: getComponent(['street_number', 'route']) || zip,
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          zip: getComponent(['postal_code']) || zip,
          country: country,
          formatted_address: result.formatted_address
        };
      }
      
      // Fallback if geocoding fails
      return {
        street1: zip,
        city: 'Unknown',
        state: country === 'US' ? 'NY' : 'Unknown',
        zip: zip,
        country: country
      };
    } catch (error) {
      console.error('Error resolving address:', error);
      return {
        street1: zip,
        city: 'Unknown',
        state: country === 'US' ? 'NY' : 'Unknown',
        zip: zip,
        country: country
      };
    }
  };

  const calculateRates = async () => {
    if (!fromZip || !toZip) {
      toast.error('Please enter both origin and destination zip codes');
      return;
    }

    if (!dimensions.weight) {
      toast.error('Please enter package weight');
      return;
    }

    if (isCustomPackage && (!dimensions.length || !dimensions.width)) {
      toast.error('Please enter package dimensions');
      return;
    }

    setIsLoading(true);
    try {
      // Resolve addresses from zip codes
      const [fromAddress, toAddress] = await Promise.all([
        resolveAddress(fromZip, fromCountry),
        resolveAddress(toZip, toCountry)
      ]);

      setResolvedAddresses({ from: fromAddress, to: toAddress });

      // Convert weight to ounces
      let weightOz = parseFloat(dimensions.weight);
      if (weightUnit === 'kg') {
        weightOz = weightOz * 35.274;
      } else if (weightUnit === 'lb') {
        weightOz = weightOz * 16;
      }

      // Build parcel object
      let parcel: any = { weight: weightOz };
      
      if (isCustomPackage) {
        parcel.length = parseFloat(dimensions.length);
        parcel.width = parseFloat(dimensions.width);
        if (showHeight && dimensions.height) {
          parcel.height = parseFloat(dimensions.height);
        } else if (packageType === 'envelope') {
          // For envelopes, set a minimal height if not provided
          parcel.height = 0.1;
        }
      } else {
        parcel.predefined_package = packageType;
      }

      const payload = {
        fromAddress: {
          name: 'Rate Calculator',
          street1: fromAddress.street1,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country,
        },
        toAddress: {
          name: 'Recipient',
          street1: toAddress.street1,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country,
        },
        parcel,
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      console.log('Rate calculator payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        setRates(data.rates);
        toast.success(`Found ${data.rates.length} shipping options`);
      } else {
        setRates([]);
        toast.info('No rates available for this route');
      }
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to calculate rates');
      setRates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipWithRate = (rate: RateResult) => {
    // Only transfer dimensions to normal shipping - not addresses or rate selection
    const dimensionsData = {
      dimensions: {
        length: dimensions.length,
        width: dimensions.width,
        height: dimensions.height,
        weight: dimensions.weight
      },
      weightUnit: weightUnit,
      packageType: packageType
    };

    // Dispatch event to transfer only dimensions to normal shipping
    document.dispatchEvent(new CustomEvent('transfer-dimensions-to-shipping', {
      detail: dimensionsData
    }));

    toast.success('Dimensions transferred to shipping form. Please complete addresses and shipping details.');
    
    // Navigate to main shipping form
    window.location.href = '/create-label';
  };

  return (
    <div className="space-y-6">
      {/* Address Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Shipping Addresses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">From Zip Code</Label>
              <div className="flex gap-2">
                <Input
                  value={fromZip}
                  onChange={(e) => setFromZip(e.target.value)}
                  placeholder="Enter zip code"
                  className="flex-1"
                />
                <Select value={fromCountry} onValueChange={setFromCountry}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="CA">CA</SelectItem>
                    <SelectItem value="GB">UK</SelectItem>
                    <SelectItem value="DE">DE</SelectItem>
                    <SelectItem value="FR">FR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">To Zip Code</Label>
              <div className="flex gap-2">
                <Input
                  value={toZip}
                  onChange={(e) => setToZip(e.target.value)}
                  placeholder="Enter zip code"
                  className="flex-1"
                />
                <Select value={toCountry} onValueChange={setToCountry}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">US</SelectItem>
                    <SelectItem value="CA">CA</SelectItem>
                    <SelectItem value="GB">UK</SelectItem>
                    <SelectItem value="DE">DE</SelectItem>
                    <SelectItem value="FR">FR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            Package Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Package Type</Label>
            <Select value={packageType} onValueChange={setPackageType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {packageTypes.map((pkg) => (
                  <SelectItem key={pkg.value} value={pkg.value}>
                    {pkg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dimensions */}
          {isCustomPackage && (
            <div>
              <Label className="text-sm font-medium">Dimensions (inches)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Length"
                  value={dimensions.length}
                  onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Width"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                />
                {showHeight && (
                  <Input
                    type="number"
                    placeholder="Height"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                  />
                )}
              </div>
            </div>
          )}

          {/* Weight */}
          <div>
            <Label className="text-sm font-medium">Weight</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Weight"
                value={dimensions.weight}
                onChange={(e) => setDimensions(prev => ({ ...prev, weight: e.target.value }))}
                className="flex-1"
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oz">oz</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={calculateRates}
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
                <Search className="w-4 h-4 mr-2" />
                Get Shipping Rates
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Shipping Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {rate.carrier.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{rate.service}</p>
                      <p className="text-sm text-gray-600">
                        {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${parseFloat(rate.rate).toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleShipWithRate(rate)}
                      className="mt-1"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      I Want This Rate
                    </Button>
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

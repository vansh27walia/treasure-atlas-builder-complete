
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Search, Loader2, ExternalLink, Clock, Truck, DollarSign, Shield, Star } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date?: string;
  original_rate?: string;
  isPremium?: boolean;
  insurance_cost?: number;
  total_cost?: number;
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
      console.log('Resolving address for:', zip, country);
      
      // Get Google API key from edge function
      const { data: keyData, error: keyError } = await supabase.functions.invoke('get-google-api-key');
      
      if (keyError || !keyData?.apiKey) {
        throw new Error('Google Maps API key not available');
      }
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zip},${country}&key=${keyData.apiKey}`
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
        
        const resolvedAddress = {
          street1: getComponent(['street_number']) + ' ' + getComponent(['route']) || zip,
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          zip: getComponent(['postal_code']) || zip,
          country: country,
          formatted_address: result.formatted_address
        };
        
        console.log('Resolved address:', resolvedAddress);
        return resolvedAddress;
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
      console.log('Starting rate calculation...');
      
      // Resolve addresses from zip codes using Google API
      const [fromAddress, toAddress] = await Promise.all([
        resolveAddress(fromZip, fromCountry),
        resolveAddress(toZip, toCountry)
      ]);

      console.log('Resolved from address:', fromAddress);
      console.log('Resolved to address:', toAddress);

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
        carriers: ['usps', 'ups', 'fedex', 'dhl'] // Request all carriers
      };

      console.log('Rate calculator payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      console.log('Received rate data:', data);

      if (data.rates && Array.isArray(data.rates)) {
        // Process rates to add premium flag and original rates like in useShippingRates
        const processedRates = data.rates.map((rate: any) => {
          const actualRate = parseFloat(rate.rate);
          const discountPercentage = Math.random() * (90 - 85) + 85;
          const inflatedRate = (actualRate * (100 / (100 - discountPercentage))).toFixed(2);
          
          const isPremium = 
            rate.service.toLowerCase().includes('express') || 
            rate.service.toLowerCase().includes('priority') || 
            rate.service.toLowerCase().includes('overnight') ||
            rate.service.toLowerCase().includes('next day') ||
            rate.service.toLowerCase().includes('same day') ||
            (rate.delivery_days === 1) ||
            actualRate > 20;
          
          return {
            ...rate,
            original_rate: inflatedRate,
            isPremium,
            total_cost: actualRate
          };
        });
        
        setRates(processedRates);
        toast.success(`Found ${processedRates.length} shipping options`);
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
    // Prepare data for the main shipping form
    const shippingData = {
      fromAddress: resolvedAddresses.from,
      toAddress: resolvedAddresses.to,
      parcel: {
        type: packageType,
        dimensions: dimensions,
        weightUnit: weightUnit
      },
      selectedRate: rate
    };

    // Store the data for transfer to main shipping form
    sessionStorage.setItem('calculatorData', JSON.stringify(shippingData));

    // Dispatch event to pre-fill main shipping form
    document.dispatchEvent(new CustomEvent('prefill-shipping-form', {
      detail: shippingData
    }));

    toast.success('Redirecting to shipping form with selected rate...');
    
    // Navigate to main shipping form
    window.location.href = '/create-label?tab=domestic';
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'usps': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ups': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'fedex': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dhl': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceIcon = (service: string) => {
    if (service.toLowerCase().includes('express') || service.toLowerCase().includes('overnight')) {
      return <Star className="w-4 h-4 text-yellow-500" />;
    }
    return <Truck className="w-4 h-4 text-gray-500" />;
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

      {/* Results - Using same format as ShippingRates component */}
      {rates.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Available Shipping Options
            </CardTitle>
            <p className="text-sm text-gray-600">
              Choose the best shipping option for your package
            </p>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-3 p-6">
                {rates.map((rate, index) => (
                  <div
                    key={rate.id || index}
                    className="group border rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(rate.service)}
                          <Badge 
                            variant="outline" 
                            className={`${getCarrierColor(rate.carrier)} font-semibold`}
                          >
                            {rate.carrier.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {rate.service}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {rate.delivery_date && (
                              <span>
                                • Delivery by {rate.delivery_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {rate.original_rate && (
                              <div className="text-xs text-gray-500 line-through">
                                ${parseFloat(rate.original_rate).toFixed(2)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-xl font-bold text-green-600">
                                ${(rate.total_cost || parseFloat(rate.rate)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {rate.insurance_cost && rate.insurance_cost > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Shield className="w-3 h-3" />
                            <span>
                              +${rate.insurance_cost.toFixed(2)} insurance
                            </span>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          className="mt-2 bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700"
                          onClick={() => handleShipWithRate(rate)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ship This
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateCalculator;

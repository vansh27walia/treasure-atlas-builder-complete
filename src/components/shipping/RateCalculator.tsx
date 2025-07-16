import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Search, Loader2, ExternalLink, Award, Zap, DollarSign, Clock, Shield } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import useRateCalculator from '@/hooks/useRateCalculator';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  original_rate?: string;
  discount?: number;
  isPremium?: boolean;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'RU', name: 'Russia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' }
];

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
  const navigate = useNavigate();
  const { fetchRates, aiRecommendation, isLoading, isAiLoading, selectRateAndProceed } = useRateCalculator();
  
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
          name: 'Rate Calculator',
          street1: getComponent(['street_number', 'route']) || zip,
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          zip: getComponent(['postal_code']) || zip,
          country: country,
          phone: '',
          formatted_address: result.formatted_address
        };
      }
      
      // Fallback if geocoding fails
      return {
        name: 'Rate Calculator',
        street1: zip,
        city: 'Unknown',
        state: country === 'US' ? 'NY' : 'Unknown',
        zip: zip,
        country: country,
        phone: ''
      };
    } catch (error) {
      console.error('Error resolving address:', error);
      return {
        name: 'Rate Calculator',
        street1: zip,
        city: 'Unknown',
        state: country === 'US' ? 'NY' : 'Unknown',
        zip: zip,
        country: country,
        phone: ''
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

    try {
      // Resolve addresses from zip codes using Google Maps API
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
        }
      } else {
        parcel.predefined_package = packageType;
      }

      const requestData = {
        fromAddress,
        toAddress,
        parcel,
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      console.log('Rate calculator request:', requestData);

      // Use the hook to fetch rates
      await fetchRates(requestData);
      
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to calculate rates');
      setRates([]);
    }
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

  const getBadgeForRate = (rateId: string) => {
    if (!aiRecommendation) return null;
    
    if (rateId === aiRecommendation.bestOverall) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
          <Award className="w-3 h-3 mr-1" />
          AI Pick
        </Badge>
      );
    }
    if (rateId === aiRecommendation.bestValue) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          <Award className="w-3 h-3 mr-1" />
          Best Value
        </Badge>
      );
    }
    if (rateId === aiRecommendation.fastest) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Fastest
        </Badge>
      );
    }
    return null;
  };

  // Listen for rates from the rate calculator hook
  React.useEffect(() => {
    const handleRatesReceived = (event: any) => {
      if (event.detail && event.detail.rates) {
        // Process rates with original pricing logic
        const processedRates = event.detail.rates.map((rate: any) => {
          const discountPercentage = Math.random() * (90 - 85) + 85;
          const actualRate = parseFloat(rate.rate);
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
            isPremium
          };
        });
        
        setRates(processedRates);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived);
    return () => document.removeEventListener('easypost-rates-received', handleRatesReceived);
  }, []);

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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code}
                      </SelectItem>
                    ))}
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
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code}
                      </SelectItem>
                    ))}
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
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating Rates...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Calculate Shipping Rates
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {aiRecommendation && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">AI Shipping Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-purple-700 mb-4">{aiRecommendation.analysisText}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Shipping Options ({rates.length} found)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-3 p-6">
              {rates.map((rate, index) => (
                <div
                  key={rate.id || index}
                  className="group border rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${getCarrierColor(rate.carrier)} font-semibold`}
                        >
                          {rate.carrier.toUpperCase()}
                        </Badge>
                        {getBadgeForRate(rate.id)}
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
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        {/* Original Rate (Inflated) */}
                        {rate.original_rate && (
                          <div className="text-sm text-gray-500 line-through">
                            ${parseFloat(rate.original_rate).toFixed(2)}
                          </div>
                        )}
                        
                        {/* Discounted Rate */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Discount Badge */}
                        {rate.original_rate && (
                          <div className="text-xs text-green-600 font-medium">
                            Save ${(parseFloat(rate.original_rate) - parseFloat(rate.rate)).toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => selectRateAndProceed(rate.id)}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ship with This Rate
                      </Button>
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

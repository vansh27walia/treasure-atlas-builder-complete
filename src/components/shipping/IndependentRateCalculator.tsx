
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, MapPin, Package, ArrowRight, Globe, Clock, Truck, DollarSign, Shield, Star, Filter } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  original_rate?: string;
  isPremium?: boolean;
}

const IndependentRateCalculator: React.FC = () => {
  const [originZip, setOriginZip] = useState('');
  const [destZip, setDestZip] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destCountry, setDestCountry] = useState('US');
  const [packageType, setPackageType] = useState('box');
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
    weight: ''
  });
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');

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

  const isInternational = originCountry !== destCountry;
  const selectedPackage = packageTypes.find(p => p.value === packageType);
  const showHeight = selectedPackage?.requiresHeight || false;
  const isCustomPackage = ['box', 'envelope'].includes(packageType);

  // Get unique carriers for filtering
  const uniqueCarriers = [...new Set(rates.map(rate => rate.carrier.toUpperCase()))];

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

  const getHyperDiscountedRate = (rate: number) => {
    return rate * 0.8;
  };

  const getInflatedRate = (rate: number) => {
    return rate * 1.15;
  };

  const fetchRates = async () => {
    if (!originZip || !destZip || !packageType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (isCustomPackage && (!dimensions.length || !dimensions.width || !dimensions.weight)) {
      toast.error('Please fill in all package dimensions and weight');
      return;
    }

    if (!isCustomPackage && !dimensions.weight) {
      toast.error('Please enter package weight');
      return;
    }

    setIsLoading(true);
    try {
      const { data: googleApiData } = await supabase.functions.invoke('get-google-api-key');
      if (!googleApiData?.apiKey) {
        toast.error('Google Maps API not configured');
        return;
      }

      const originQuery = `${originZip}, ${countries.find(c => c.code === originCountry)?.name || originCountry}`;
      const originResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(originQuery)}&key=${googleApiData.apiKey}`);
      const originData = await originResponse.json();

      const destQuery = `${destZip}, ${countries.find(c => c.code === destCountry)?.name || destCountry}`;
      const destResponse = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destQuery)}&key=${googleApiData.apiKey}`);
      const destData = await destResponse.json();

      if (!originData.results[0] || !destData.results[0]) {
        toast.error('Invalid zip codes or addresses');
        return;
      }

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

      let parcel: any = { weight: (parseFloat(dimensions.weight) || 1) * 16 };
      
      if (isCustomPackage) {
        parcel.length = parseFloat(dimensions.length) || 10;
        parcel.width = parseFloat(dimensions.width) || 10;
        if (showHeight && dimensions.height) {
          parcel.height = parseFloat(dimensions.height) || 5;
        }
      } else {
        parcel.predefined_package = packageType;
      }

      const payload = {
        fromAddress,
        toAddress,
        parcel,
        carriers: ['usps', 'ups', 'fedex', 'dhl'],
        options: {},
        customs_info: isInternational ? null : undefined,
        insurance_info: null
      };

      console.log('Fetching rates with payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.rates && Array.isArray(data.rates)) {
        const processedRates = data.rates.map(rate => ({
          ...rate,
          insurance_cost: 0,
          total_cost: parseFloat(rate.rate),
          original_rate: (parseFloat(rate.rate) * 1.15).toFixed(2),
          isPremium: rate.service.toLowerCase().includes('express') || 
                    rate.service.toLowerCase().includes('priority') || 
                    rate.service.toLowerCase().includes('overnight') ||
                    parseFloat(rate.rate) > 20
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
    const calculatorData = {
      originZip,
      destZip,
      originCountry,
      destCountry,
      packageType,
      dimensions,
      selectedRate: rate,
      isInternational,
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    sessionStorage.setItem('transferToShipping', 'true');
    
    toast.success(`Package data saved! ${isInternational ? 'International customs documentation will be required.' : 'Go to Create Label to complete shipping.'}`);

    document.dispatchEvent(new CustomEvent('calculator-ship-selected', {
      detail: calculatorData
    }));
  };

  // Filter and sort rates
  const filteredRates = rates.filter(rate => 
    carrierFilter === 'all' || rate.carrier.toUpperCase() === carrierFilter.toUpperCase()
  );

  const sortedRates = [...filteredRates].sort((a, b) => {
    if (sortOrder === 'price') {
      return parseFloat(a.rate) - parseFloat(b.rate);
    } else if (sortOrder === 'speed') {
      return a.delivery_days - b.delivery_days;
    } else {
      return a.carrier.localeCompare(b.carrier);
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calculator className="h-6 w-6" />
            {isInternational ? 'International' : 'Domestic'} Rate Calculator
            {isInternational && <Globe className="h-5 w-5 text-blue-600" />}
          </CardTitle>
          <p className="text-blue-700">Compare shipping rates from multiple carriers instantly</p>
        </CardHeader>
      </Card>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin and Destination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Shipping Addresses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium">Origin</Label>
                <div className="flex gap-2">
                  <Input
                    value={originZip}
                    onChange={(e) => setOriginZip(e.target.value)}
                    placeholder="Enter zip code"
                    className="flex-1"
                  />
                  <Select value={originCountry} onValueChange={setOriginCountry}>
                    <SelectTrigger className="w-24">
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
                <Label className="text-sm font-medium">Destination</Label>
                <div className="flex gap-2">
                  <Input
                    value={destZip}
                    onChange={(e) => setDestZip(e.target.value)}
                    placeholder="Enter zip code"
                    className="flex-1"
                  />
                  <Select value={destCountry} onValueChange={setDestCountry}>
                    <SelectTrigger className="w-24">
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
          </CardContent>
        </Card>

        {/* Package Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
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

            <div>
              <Label className="text-sm font-medium">Weight (lbs)</Label>
              <Input
                type="number"
                placeholder="0"
                value={dimensions.weight}
                onChange={(e) => setDimensions(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>

            {isCustomPackage && (
              <div>
                <Label className="text-sm font-medium">Dimensions (inches)</Label>
                <div className="grid grid-cols-2 gap-2">
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
                      className="col-span-2"
                    />
                  )}
                </div>
              </div>
            )}

            <Button 
              onClick={fetchRates}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calculating Rates...
                </>
              ) : (
                <>
                  Get {isInternational ? 'International' : 'Domestic'} Rates
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <CardTitle className="text-xl text-blue-800">
                Available {isInternational ? 'International' : 'Domestic'} Rates ({rates.length})
              </CardTitle>
              <div className="flex gap-2 mt-4 lg:mt-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      {carrierFilter === 'all' ? 'All Carriers' : carrierFilter.toUpperCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setCarrierFilter('all')}>
                      All Carriers
                    </DropdownMenuItem>
                    {uniqueCarriers.map((carrier) => (
                      <DropdownMenuItem 
                        key={carrier} 
                        onClick={() => setCarrierFilter(carrier)}
                      >
                        {carrier}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Sort: {sortOrder === 'price' ? 'Price' : sortOrder === 'speed' ? 'Speed' : 'Carrier'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setSortOrder('price')}>
                      Price (Lowest First)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('speed')}>
                      Speed (Fastest First)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('carrier')}>
                      Carrier (A-Z)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedRates.map((rate) => {
                const baseRate = parseFloat(rate.rate);
                const inflatedRate = getInflatedRate(baseRate);
                const hyperDiscountedRate = getHyperDiscountedRate(baseRate);

                return (
                  <div 
                    key={rate.id} 
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

                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            {rate.currency} {baseRate.toFixed(2)}
                          </span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => handleShipThis(rate)}
                          className="bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700"
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
            
            {sortedRates.length === 0 && filteredRates.length === 0 && rates.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No rates match the current filter.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setCarrierFilter('all')} 
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IndependentRateCalculator;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, MapPin, Package, ArrowRight, Globe, Clock, Truck, DollarSign, Shield, Star, Filter, Sparkles } from 'lucide-react';
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
    { value: 'box', label: 'Custom Box', requiresHeight: true },
    { value: 'envelope', label: 'Custom Envelope', requiresHeight: false },
    { value: 'FlatRateEnvelope', label: 'USPS Flat Rate Envelope', requiresHeight: false },
    { value: 'SmallFlatRateBox', label: 'USPS Small Flat Rate Box', requiresHeight: false },
    { value: 'MediumFlatRateBox', label: 'USPS Medium Flat Rate Box', requiresHeight: false },
    { value: 'LargeFlatRateBox', label: 'USPS Large Flat Rate Box', requiresHeight: false },
    { value: 'UPSLetter', label: 'UPS Letter', requiresHeight: false },
    { value: 'UPSExpressBox', label: 'UPS Express Box', requiresHeight: false },
    { value: 'FedExEnvelope', label: 'FedEx Envelope', requiresHeight: false },
    { value: 'FedExBox', label: 'FedEx Box', requiresHeight: false },
    { value: 'DHLExpressEnvelope', label: 'DHL Express Envelope', requiresHeight: false },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Modern Header Section */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Calculator className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Smart Rate Calculator
            </h1>
            <p className="text-gray-600 text-lg">Compare shipping rates from multiple carriers instantly</p>
            {isInternational && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Globe className="w-4 h-4" />
                International shipping detected
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Address Input Section */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <MapPin className="h-6 w-6 text-green-600" />
              Shipping Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Origin */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Label className="text-lg font-medium text-gray-800">From (Origin)</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      value={originZip}
                      onChange={(e) => setOriginZip(e.target.value)}
                      placeholder="Enter ZIP code"
                      className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <Select value={originCountry} onValueChange={setOriginCountry}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
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
              
              {/* Destination */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <Label className="text-lg font-medium text-gray-800">To (Destination)</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input
                      value={destZip}
                      onChange={(e) => setDestZip(e.target.value)}
                      placeholder="Enter ZIP code"
                      className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <Select value={destCountry} onValueChange={setDestCountry}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
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

            {/* Package Details */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-purple-600" />
                <Label className="text-lg font-medium text-gray-800">Package Information</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Package Type</Label>
                    <Select value={packageType} onValueChange={setPackageType}>
                      <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="box">📦 Custom Box</SelectItem>
                        <SelectItem value="envelope">📮 Custom Envelope</SelectItem>
                        <SelectItem value="FlatRateEnvelope">📮 USPS Flat Rate Envelope</SelectItem>
                        <SelectItem value="SmallFlatRateBox">📦 USPS Small Flat Rate Box</SelectItem>
                        <SelectItem value="MediumFlatRateBox">📦 USPS Medium Flat Rate Box</SelectItem>
                        <SelectItem value="LargeFlatRateBox">📦 USPS Large Flat Rate Box</SelectItem>
                        <SelectItem value="UPSLetter">📮 UPS Letter</SelectItem>
                        <SelectItem value="UPSExpressBox">📦 UPS Express Box</SelectItem>
                        <SelectItem value="FedExEnvelope">📮 FedEx Envelope</SelectItem>
                        <SelectItem value="FedExBox">📦 FedEx Box</SelectItem>
                        <SelectItem value="DHLExpressEnvelope">📮 DHL Express Envelope</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Weight (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={dimensions.weight}
                      onChange={(e) => setDimensions(prev => ({ ...prev, weight: e.target.value }))}
                      className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                </div>

                {isCustomPackage && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Dimensions (inches)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Length"
                        value={dimensions.length}
                        onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Width"
                        value={dimensions.width}
                        onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                      />
                      {showHeight && (
                        <Input
                          type="number"
                          placeholder="Height"
                          value={dimensions.height}
                          onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl col-span-2"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <Button 
                  onClick={fetchRates}
                  disabled={isLoading}
                  className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Calculating Best Rates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-3 h-5 w-5" />
                      Get {isInternational ? 'International' : 'Domestic'} Rates
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {rates.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <CardTitle className="text-2xl text-blue-800 flex items-center gap-2">
                  <Truck className="h-6 w-6" />
                  Available {isInternational ? 'International' : 'Domestic'} Rates ({rates.length})
                </CardTitle>
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50 rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
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
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50 rounded-xl">
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
              <div className="space-y-4">
                {sortedRates.map((rate) => {
                  const baseRate = parseFloat(rate.rate);
                  const inflatedRate = getInflatedRate(baseRate);
                  const hyperDiscountedRate = getHyperDiscountedRate(baseRate);

                  return (
                    <div 
                      key={rate.id} 
                      className="group border-2 border-gray-200 hover:border-blue-300 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-3">
                            {getServiceIcon(rate.service)}
                            <Badge 
                              variant="outline" 
                              className={`${getCarrierColor(rate.carrier)} font-semibold px-3 py-1 text-sm`}
                            >
                              {rate.carrier.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700">
                              {rate.service}
                            </h3>
                            
                            <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span className="font-medium">
                                  {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                                </span>
                              </div>
                              
                              {rate.delivery_date && (
                                <span className="text-blue-600 font-medium">
                                  Delivery by {rate.delivery_date}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="space-y-2 mb-4">
                            <div className="text-sm text-gray-500 line-through">
                              Regular: ${inflatedRate.toFixed(2)}
                            </div>
                            <div className="text-lg text-orange-600 font-semibold">
                              Our Price: ${baseRate.toFixed(2)}
                            </div>
                            <div className="text-sm text-green-600 font-bold">
                              You Pay: ${hyperDiscountedRate.toFixed(2)}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                              Save {Math.round((1 - hyperDiscountedRate / inflatedRate) * 100)}%
                            </div>
                          </div>

                          <div className="flex items-center gap-3 mb-3">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">
                              {rate.currency} {baseRate.toFixed(2)}
                            </span>
                          </div>
                          
                          <Button 
                            onClick={() => handleShipThis(rate)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg group-hover:shadow-xl transition-all"
                          >
                            Ship This Package
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {sortedRates.length === 0 && filteredRates.length === 0 && rates.length > 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Filter className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No rates match the current filter.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setCarrierFilter('all')} 
                    className="h-12 px-6 border-2 border-blue-200 hover:bg-blue-50 rounded-xl"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IndependentRateCalculator;

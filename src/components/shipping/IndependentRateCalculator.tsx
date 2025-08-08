import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calculator, MapPin, Package, ArrowRight, Globe, Clock, Truck, Shield, Filter, Sparkles } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CarrierLogo from './CarrierLogo';

// Changed insurance cost to $2 as requested
const INSURANCE_COST_PERCENTAGE = 0.02; // 2% of insurance amount
const DEFAULT_INSURANCE_AMOUNT = 100;
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
  discount_percentage?: number;
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
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [rates, setRates] = useState<RateResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [insuranceAmount, setInsuranceAmount] = useState(DEFAULT_INSURANCE_AMOUNT);
  const countries = [{
    code: 'US',
    name: 'United States'
  }, {
    code: 'CA',
    name: 'Canada'
  }, {
    code: 'GB',
    name: 'United Kingdom'
  }, {
    code: 'DE',
    name: 'Germany'
  }, {
    code: 'FR',
    name: 'France'
  }, {
    code: 'JP',
    name: 'Japan'
  }, {
    code: 'AU',
    name: 'Australia'
  }, {
    code: 'MX',
    name: 'Mexico'
  }];
  const packageTypes = [{
    value: 'box',
    label: '📦 Custom Box',
    requiresHeight: true
  }, {
    value: 'envelope',
    label: '📮 Custom Envelope',
    requiresHeight: false
  }, {
    value: 'FlatRateEnvelope',
    label: '📮 USPS Flat Rate Envelope',
    requiresHeight: false
  }, {
    value: 'SmallFlatRateBox',
    label: '📦 USPS Small Flat Rate Box',
    requiresHeight: false
  }, {
    value: 'MediumFlatRateBox',
    label: '📦 USPS Medium Flat Rate Box',
    requiresHeight: false
  }, {
    value: 'LargeFlatRateBox',
    label: '📦 USPS Large Flat Rate Box',
    requiresHeight: false
  }, {
    value: 'UPSLetter',
    label: '📮 UPS Letter',
    requiresHeight: false
  }, {
    value: 'UPSExpressBox',
    label: '📦 UPS Express Box',
    requiresHeight: false
  }, {
    value: 'FedExEnvelope',
    label: '📮 FedEx Envelope',
    requiresHeight: false
  }, {
    value: 'FedExBox',
    label: '📦 FedEx Box',
    requiresHeight: false
  }, {
    value: 'DHLExpressEnvelope',
    label: '📮 DHL Express Envelope',
    requiresHeight: false
  }];
  const isInternational = originCountry !== destCountry;
  const selectedPackage = packageTypes.find(p => p.value === packageType);
  const showHeight = selectedPackage?.requiresHeight || false;
  const isCustomPackage = ['box', 'envelope'].includes(packageType);
  const uniqueCarriers = [...new Set(rates.map(rate => rate.carrier.toUpperCase()))];
  const convertWeight = (weight: number, fromUnit: string, toUnit: string = 'oz') => {
    const conversions = {
      'lbs': 16,
      'kg': 35.274,
      'oz': 1
    };
    return weight * conversions[fromUnit as keyof typeof conversions];
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
      const {
        data: googleApiData
      } = await supabase.functions.invoke('get-google-api-key');
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
          phone: ''
        };
      };
      const fromAddress = parseGoogleAddress(originData.results[0], originCountry);
      const toAddress = parseGoogleAddress(destData.results[0], destCountry);
      let parcel: any = {
        weight: convertWeight(parseFloat(dimensions.weight) || 1, weightUnit)
      };
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
        insurance_info: insuranceEnabled ? {
          amount: insuranceAmount,
          cost: Math.round(insuranceAmount * INSURANCE_COST_PERCENTAGE) // $2 for $100 coverage
        } : null
      };
      console.log('Fetching rates with payload:', payload);
      const {
        data,
        error
      } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.rates && Array.isArray(data.rates)) {
        const processedRates = data.rates.map(rate => ({
          ...rate,
          insurance_cost: insuranceEnabled ? Math.round(insuranceAmount * INSURANCE_COST_PERCENTAGE) : 0,
          total_cost: parseFloat(rate.rate) + (insuranceEnabled ? Math.round(insuranceAmount * INSURANCE_COST_PERCENTAGE) : 0)
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
  const getCarrierGradient = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'usps':
        return 'from-blue-500 to-blue-700';
      case 'ups':
        return 'from-yellow-500 to-yellow-600';
      case 'fedex':
        return 'from-purple-500 to-purple-700';
      case 'dhl':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-500 to-gray-700';
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
      insuranceEnabled,
      insuranceAmount,
      timestamp: new Date().toISOString()
    };
    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    sessionStorage.setItem('transferToShipping', 'true');
    toast.success(`Package data saved! ${isInternational ? 'International customs documentation will be required.' : 'Go to Create Label to complete shipping.'}`);
    window.location.href = '/create-label';
  };
  const filteredRates = rates.filter(rate => carrierFilter === 'all' || rate.carrier.toUpperCase() === carrierFilter.toUpperCase());
  const sortedRates = [...filteredRates].sort((a, b) => {
    if (sortOrder === 'price') {
      return parseFloat(a.rate) - parseFloat(b.rate);
    } else if (sortOrder === 'speed') {
      return a.delivery_days - b.delivery_days;
    } else {
      return a.carrier.localeCompare(b.carrier);
    }
  });
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Calculator className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Smart Rate Calculator
          </h1>
          <p className="text-gray-600 text-lg">Compare shipping rates from multiple carriers instantly</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <CarrierLogo carrier="usps" className="h-8" />
              <CarrierLogo carrier="ups" className="h-8" />
              <CarrierLogo carrier="fedex" className="h-8" />
              <CarrierLogo carrier="dhl" className="h-8" />
            </div>
            {insuranceEnabled && <Badge variant="secondary" className="bg-green-100 text-green-700">
                ${insuranceAmount} Insurance Included
              </Badge>}
          </div>
          {isInternational && <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Globe className="w-4 h-4" />
              International shipping detected
            </div>}
        </div>

        {/* Insurance Toggle Section */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Shield className="h-5 w-5 text-green-600" />
              Insurance Options
            </CardTitle>
          </CardHeader>
          
        </Card>

        {/* Address Input Section - Top */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <MapPin className="h-5 w-5 text-green-600" />
              Shipping Addresses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Origin */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Label className="text-base font-semibold text-gray-800">From (Origin)</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input value={originZip} onChange={e => setOriginZip(e.target.value)} placeholder="Enter ZIP code" className="h-12 text-base border-2 border-gray-200 focus:border-blue-500" />
                  </div>
                  <Select value={originCountry} onValueChange={setOriginCountry}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => <SelectItem key={country.code} value={country.code}>
                          {country.code}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Destination */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <Label className="text-base font-semibold text-gray-800">To (Destination)</Label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Input value={destZip} onChange={e => setDestZip(e.target.value)} placeholder="Enter ZIP code" className="h-12 text-base border-2 border-gray-200 focus:border-blue-500" />
                  </div>
                  <Select value={destCountry} onValueChange={setDestCountry}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => <SelectItem key={country.code} value={country.code}>
                          {country.code}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Details Section - Bottom */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Package className="h-5 w-5 text-purple-600" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package Type */}
            <div>
              <Label className="text-base font-semibold text-gray-800 mb-3 block">Package Type</Label>
              <Select value={packageType} onValueChange={setPackageType}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {packageTypes.map(pkg => <SelectItem key={pkg.value} value={pkg.value}>
                      {pkg.label}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            {isCustomPackage && <div>
                <Label className="text-base font-semibold text-gray-800 mb-3 block">Dimensions (inches)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input type="number" placeholder="Length" value={dimensions.length} onChange={e => setDimensions(prev => ({
                ...prev,
                length: e.target.value
              }))} className="h-12 border-2 border-gray-200 focus:border-blue-500" />
                  <Input type="number" placeholder="Width" value={dimensions.width} onChange={e => setDimensions(prev => ({
                ...prev,
                width: e.target.value
              }))} className="h-12 border-2 border-gray-200 focus:border-blue-500" />
                  {showHeight && <Input type="number" placeholder="Height" value={dimensions.height} onChange={e => setDimensions(prev => ({
                ...prev,
                height: e.target.value
              }))} className="h-12 border-2 border-gray-200 focus:border-blue-500" />}
                </div>
              </div>}

            {/* Weight */}
            <div>
              <Label className="text-base font-semibold text-gray-800 mb-3 block">Weight</Label>
              <div className="flex gap-3">
                <Input type="number" placeholder="0.0" value={dimensions.weight} onChange={e => setDimensions(prev => ({
                ...prev,
                weight: e.target.value
              }))} className="flex-1 h-12 text-base border-2 border-gray-200 focus:border-blue-500" />
                <Select value={weightUnit} onValueChange={setWeightUnit}>
                  <SelectTrigger className="w-32 h-12 border-2 border-gray-200 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">Pounds</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="oz">Ounces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button onClick={fetchRates} disabled={isLoading} className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" size="lg">
                {isLoading ? <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Calculating Best Rates...
                  </> : <>
                    <Sparkles className="mr-3 h-5 w-5" />
                    Get {isInternational ? 'International' : 'Domestic'} Rates
                  </>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {rates.length > 0 && <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <CardTitle className="text-2xl text-blue-800 flex items-center gap-2">
                  <Truck className="h-6 w-6" />
                  Available {isInternational ? 'International' : 'Domestic'} Rates ({rates.length})
                </CardTitle>
                <div className="flex gap-3 mt-4 lg:mt-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50">
                        <Filter className="h-4 w-4 mr-2" />
                        {carrierFilter === 'all' ? 'All Carriers' : carrierFilter.toUpperCase()}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setCarrierFilter('all')}>
                        All Carriers
                      </DropdownMenuItem>
                      {uniqueCarriers.map(carrier => <DropdownMenuItem key={carrier} onClick={() => setCarrierFilter(carrier)}>
                          {carrier}
                        </DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedRates.map(rate => {
              const currentRate = parseFloat(rate.rate);
              const originalRate = parseFloat(rate.original_rate || rate.rate);
              const discountPercentage = rate.discount_percentage || 0;
              return <div key={rate.id} className="border-2 border-gray-200 hover:border-blue-300 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Carrier Header */}
                      <div className={`bg-gradient-to-r ${getCarrierGradient(rate.carrier)} p-3 text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CarrierLogo carrier={rate.carrier} className="h-6 bg-white/20 text-white" />
                            {discountPercentage > 0 && <Badge className="bg-green-500 text-white text-xs">
                                {Math.round(discountPercentage)}% OFF
                              </Badge>}
                          </div>
                        </div>
                        <div className="text-sm opacity-90 mt-1">{rate.service}</div>
                      </div>

                      {/* Rate Details */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-green-600">
                              ${currentRate.toFixed(2)}
                            </div>
                            {originalRate > currentRate && <div className="text-lg text-gray-500 line-through">
                                ${originalRate.toFixed(2)}
                              </div>}
                          </div>
                        </div>

                        {insuranceEnabled && <div className="text-sm text-green-600 mb-3 flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            ${insuranceAmount} insurance coverage included (${Math.round(insuranceAmount * INSURANCE_COST_PERCENTAGE)})
                          </div>}

                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span>Protected</span>
                          </div>
                        </div>

                        <Button onClick={() => handleShipThis(rate)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          Ship This Package
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>;
            })}
              </div>
              
              {sortedRates.length === 0 && filteredRates.length === 0 && rates.length > 0 && <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Filter className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-600 text-lg mb-4">No rates match the current filter.</p>
                  <Button variant="outline" onClick={() => setCarrierFilter('all')} className="h-12 px-6 border-2 border-blue-200 hover:bg-blue-50">
                    Clear Filters
                  </Button>
                </div>}
            </CardContent>
          </Card>}
      </div>
    </div>;
};
export default IndependentRateCalculator;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calculator, MapPin, Package, ArrowRight, Globe, Clock, Truck, Shield, Filter, Sparkles, FileText } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { COUNTRIES_LIST, countries } from '@/lib/countries';
import CarrierLogo from './CarrierLogo';
import PackageTypeSelector from './PackageTypeSelector';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatCalculator from './HazmatCalculator';

// Insurance always $100 as requested
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
  isAIRecommended?: boolean;
}

interface AIRecommendation {
  bestOverall: string | null;
  bestValue: string | null;
  fastest: string | null;
  mostReliable: string | null;
  analysisText: string;
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
  
  // Insurance and Hazmat settings - not used during rate fetching
  const [insuranceSettings, setInsuranceSettings] = useState({
    enabled: true,
    amount: DEFAULT_INSURANCE_AMOUNT
  });
  const [hazmatSettings, setHazmatSettings] = useState({
    enabled: false
  });
  
  const [customsClearance, setCustomsClearance] = useState(false);
  const [customsInfo, setCustomsInfo] = useState({
    contents: '',
    value: '',
    description: ''
  });
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isInternational = originCountry !== destCountry;
  const isCustomPackage = ['box', 'envelope'].includes(packageType);
  const uniqueCarriers = [...new Set(rates.map(rate => rate.carrier.toUpperCase()))];

  // Auto-set height to 0 for envelopes and hide height field
  useEffect(() => {
    if (packageType === 'envelope') {
      setDimensions(prev => ({ ...prev, height: '0' }));
    }
  }, [packageType]);

  const convertWeight = (weight: number, fromUnit: string, toUnit: string = 'oz') => {
    const conversions = {
      'lbs': 16,
      'kg': 35.274,
      'oz': 1
    };
    return weight * conversions[fromUnit as keyof typeof conversions];
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

  // Standardize carrier names to show clean names
  const standardizeCarrierName = (carrier: string) => {
    const name = carrier.toUpperCase().trim();
    if (name.includes('UPS')) return 'UPS';
    if (name.includes('FEDEX') || name.includes('FEDERAL EXPRESS')) return 'FedEx';
    if (name.includes('USPS') || name.includes('US POSTAL')) return 'USPS';
    if (name.includes('DHL')) return 'DHL';
    return carrier;
  };

  const fetchAiRecommendations = async (rates: RateResult[]) => {
    if (rates.length === 0) return;
    
    setIsAiLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rates', {
        body: { rates }
      });
      
      if (error) {
        console.error('Error getting AI recommendations:', error);
        return;
      }
      
      if (data) {
        setAiRecommendation({
          bestOverall: data.bestOverallRateId || null,
          bestValue: data.bestValueRateId || null,
          fastest: data.fastestRateId || null,
          mostReliable: data.mostReliableRateId || null,
          analysisText: data.analysis || ''
        });
      }
    } catch (error) {
      console.error('Error in AI recommendation:', error);
    } finally {
      setIsAiLoading(false);
    }
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
    setAiRecommendation(null);
    
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
        // For envelopes, always set height to 0 in backend
        if (packageType === 'envelope') {
          parcel.height = 0;
        } else if (dimensions.height) {
          parcel.height = parseFloat(dimensions.height) || 5;
        }
      } else {
        parcel.predefined_package = packageType;
      }
      
      // IMPORTANT: Do NOT include insurance or hazmat in rate fetching
      const payload = {
        fromAddress,
        toAddress,
        parcel,
        carriers: ['usps', 'ups', 'fedex', 'dhl'],
        options: {},
        customs_info: customsClearance ? customsInfo : null
        // insurance_info and hazmat_info are excluded from rate fetching
      };
      
      console.log('Fetching rates with payload (excluding insurance/hazmat):', payload);
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.rates && Array.isArray(data.rates)) {
        const processedRates = data.rates.map(rate => ({
          ...rate,
          carrier: standardizeCarrierName(rate.carrier)
          // Note: insurance_cost and total_cost are NOT calculated here
          // They will be handled during label creation
        }));
        
        setRates(processedRates);
        
        // Get AI recommendations after rates are fetched
        if (processedRates.length > 0) {
          fetchAiRecommendations(processedRates);
        }
        
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
      insuranceSettings,
      hazmatSettings,
      customsClearance,
      customsInfo,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">      
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
          </div>
          {isInternational && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <Globe className="w-4 h-4" />
              International shipping detected
            </div>
          )}
        </div>

        {/* Address Input Section */}
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
                    <Input 
                      value={originZip} 
                      onChange={e => setOriginZip(e.target.value)} 
                      placeholder="Enter ZIP code" 
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500" 
                    />
                  </div>
                  <select
                    value={originCountry}
                    onChange={e => setOriginCountry(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-md px-3"
                  >
                    {COUNTRIES_LIST.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
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
                    <Input 
                      value={destZip} 
                      onChange={e => setDestZip(e.target.value)} 
                      placeholder="Enter ZIP code" 
                      className="h-12 text-base border-2 border-gray-200 focus:border-blue-500" 
                    />
                  </div>
                  <select
                    value={destCountry}
                    onChange={e => setDestCountry(e.target.value)}
                    className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-md px-3"
                  >
                    {COUNTRIES_LIST.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Details Section */}
        <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <Package className="h-5 w-5 text-purple-600" />
              Package Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Package Type Selector */}
            <PackageTypeSelector value={packageType} onChange={setPackageType} />

            {/* Dimensions - For envelopes, don't show height field */}
            {isCustomPackage && (
              <div>
                <Label className="text-base font-semibold text-gray-800 mb-3 block">
                  Dimensions (inches)
                  {packageType === 'envelope' && (
                    <span className="text-sm text-gray-500 ml-2">(Height automatically set to 0 for envelopes)</span>
                  )}
                </Label>
                <div className="grid grid-cols-3 gap-4">
  <Input
    type="number"
    placeholder="Length"
    value={dimensions.length}
    onChange={e => setDimensions(prev => ({ ...prev, length: e.target.value }))}
    className="h-12 border-2 border-gray-200 focus:border-blue-500"
  />
  <Input
    type="number"
    placeholder="Width"
    value={dimensions.width}
    onChange={e => setDimensions(prev => ({ ...prev, width: e.target.value }))}
    className="h-12 border-2 border-gray-200 focus:border-blue-500"
  />
  {packageType === 'box' && (
    <Input
      type="number"
      placeholder="Height"
      value={dimensions.height}
      onChange={e => setDimensions(prev => ({ ...prev, height: e.target.value }))}
      className="h-12 border-2 border-gray-200 focus:border-blue-500"
    />
  )}
</div>
              </div>
            )}

            {/* Weight */}
            <div>
              <Label className="text-base font-semibold text-gray-800 mb-3 block">Weight</Label>
              <div className="flex gap-3">
                <Input 
                  type="number" 
                  placeholder="0.0" 
                  value={dimensions.weight} 
                  onChange={e => setDimensions(prev => ({ ...prev, weight: e.target.value }))} 
                  className="flex-1 h-12 text-base border-2 border-gray-200 focus:border-blue-500" 
                />
                <select
                  value={weightUnit}
                  onChange={e => setWeightUnit(e.target.value)}
                  className="w-32 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-md px-3"
                >
                  <option value="lbs">Pounds</option>
                  <option value="kg">Kilograms</option>
                  <option value="oz">Ounces</option>
                </select>
              </div>
            </div>

            <div className="text-center pt-4">
              <Button 
                onClick={fetchRates} 
                disabled={isLoading} 
                className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" 
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
          </CardContent>
        </Card>

        {/* Insurance Section - Only shown after rates are fetched */}
        {rates.length > 0 && (
          <div className="mb-8">
            <InsuranceCalculator
              onInsuranceChange={(enabled, amount) => 
                setInsuranceSettings({ enabled, amount })
              }
            />
          </div>
        )}

        {/* Hazmat Section - Only shown after rates are fetched */}
        {rates.length > 0 && (
          <div className="mb-8">
            <HazmatCalculator
              onHazmatChange={(enabled) => 
                setHazmatSettings({ enabled })
              }
            />
          </div>
        )}

        {/* Customs Clearance Section */}
        {isInternational && rates.length > 0 && (
          <Card className="mb-8 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="h-5 w-5 text-orange-600" />
                Customs Clearance Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="customs-toggle"
                    checked={customsClearance}
                    onCheckedChange={setCustomsClearance}
                  />
                  <Label htmlFor="customs-toggle" className="text-base font-medium">
                    Include customs clearance documents
                  </Label>
                </div>
                
                {customsClearance && (
                  <div className="space-y-3 mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div>
                      <Label className="text-sm font-medium">Contents Description</Label>
                      <Input
                        value={customsInfo.contents}
                        onChange={(e) => setCustomsInfo(prev => ({ ...prev, contents: e.target.value }))}
                        placeholder="e.g., Electronics, Clothing, Documents"
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Declared Value ($)</Label>
                        <Input
                          type="number"
                          value={customsInfo.value}
                          onChange={(e) => setCustomsInfo(prev => ({ ...prev, value: e.target.value }))}
                          placeholder="100.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Additional Description</Label>
                        <Input
                          value={customsInfo.description}
                          onChange={(e) => setCustomsInfo(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Optional details"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Panel */}
        {aiRecommendation && (
          <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Rate Analysis
                {isAiLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aiRecommendation.analysisText && (
                <div className="bg-white/70 p-4 rounded-lg mb-4">
                  <p className="text-gray-700 text-sm leading-relaxed">{aiRecommendation.analysisText}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiRecommendation.bestValue && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 p-2 justify-center">
                    Best Value Choice
                  </Badge>
                )}
                {aiRecommendation.fastest && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 p-2 justify-center">
                    Fastest Option
                  </Badge>
                )}
                {aiRecommendation.bestOverall && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 p-2 justify-center">
                    AI Recommended
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50">
                        <Filter className="h-4 w-4 mr-2" />
                        {carrierFilter === 'all' ? 'All Carriers' : carrierFilter.toUpperCase()}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
                      <DropdownMenuItem onClick={() => setCarrierFilter('all')}>
                        All Carriers
                      </DropdownMenuItem>
                      {uniqueCarriers.map(carrier => (
                        <DropdownMenuItem key={carrier} onClick={() => setCarrierFilter(carrier)}>
                          {carrier}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-10 px-4 border-2 border-blue-200 hover:bg-blue-50">
                        Sort: {sortOrder === 'price' ? 'Price' : sortOrder === 'speed' ? 'Speed' : 'Carrier'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
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
                  const isAIRecommended = aiRecommendation?.bestOverall === rate.id || 
                                        aiRecommendation?.bestValue === rate.id || 
                                        aiRecommendation?.fastest === rate.id;
                  
                  return (
                    <div key={rate.id} className="border-2 border-gray-200 hover:border-blue-300 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300">
                      {/* Carrier Header with proper colors */}
                      <div className={`bg-gradient-to-r ${getCarrierGradient(rate.carrier)} p-4 text-white relative`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CarrierLogo carrier={rate.carrier} className="h-8 bg-white/20 text-white" />
                            <div>
                              <div className="font-bold text-lg">{rate.carrier}</div>
                              <div className="text-sm opacity-90">{rate.service}</div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isAIRecommended && (
                              <Badge className="bg-yellow-500 text-black text-xs font-bold">
                                🤖 AI RECOMMENDED
                              </Badge>
                            )}
                            {discountPercentage > 0 && (
                              <Badge className="bg-green-500 text-white text-xs">
                                {Math.round(discountPercentage)}% OFF
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rate Details */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-green-600">
                              ${currentRate.toFixed(2)}
                            </div>
                            {originalRate > currentRate && (
                              <div className="text-lg text-gray-500 line-through">
                                ${originalRate.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <Button 
                          onClick={() => handleShipThis(rate)} 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Ship This Package
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
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
                    className="h-12 px-6 border-2 border-blue-200 hover:bg-blue-50"
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

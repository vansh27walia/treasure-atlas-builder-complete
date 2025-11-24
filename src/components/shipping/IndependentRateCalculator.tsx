
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
import EnhancedRateFilter from './EnhancedRateFilter';
import { COUNTRIES_LIST, countries } from '@/lib/countries';
import CarrierLogo from './CarrierLogo';
import PackageTypeSelector from './PackageTypeSelector';
import AIRateAnalysisPanel from './AIRateAnalysisPanel';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
  
  // Insurance and Hazmat settings removed from rate calculator
  // These should only be in normal shipping flow
  
  const [customsClearance, setCustomsClearance] = useState(false);
  const [customsInfo, setCustomsInfo] = useState({
    contents: '',
    value: '',
    description: ''
  });
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRateForAI, setSelectedRateForAI] = useState<RateResult | null>(null);

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
    // Only transfer ZIP codes, weight, and dimensions to normal shipping
    const shippingData = {
      fromZip: originZip,
      toZip: destZip,
      weight: dimensions.weight,
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
      weightUnit
    };

    sessionStorage.setItem('rateCalculatorTransfer', JSON.stringify(shippingData));
    navigate('/create-label?tab=domestic');
    toast.success('Redirecting to normal shipping...');
  };

  const handleRateClick = (rate: RateResult) => {
    setSelectedRateForAI(rate);
    setShowAIPanel(true);
  };

  const handleOptimizationChange = (filterId: string) => {
    // Handle filter changes from AI panel
    if (filterId === 'cheapest') {
      setSortOrder('price');
    } else if (filterId === 'fastest') {
      setSortOrder('speed');
    }
    // Additional filter logic can be added here
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

        {/* Results Section */}
        {rates.length > 0 && (
          <>
            {/* Rate Count Header with AI Button */}
            <Card className="mb-6 shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-600">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Truck className="h-8 w-8" />
                    We found {rates.length} {isInternational ? 'International' : 'Domestic'} rates for you
                  </h2>
                  <Button 
                    onClick={() => setShowAIPanel(true)}
                    className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg font-bold"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Panel - At top after rate count */}
            {aiRecommendation && (
              <Card className="mb-6 shadow-xl border-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-6 w-6 animate-pulse" />
                      <h3 className="text-xl font-bold">AI Recommended Rates</h3>
                      {isAiLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                    </div>
                  </div>
                  {aiRecommendation.analysisText && (
                    <div className="bg-white/90 p-5 rounded-xl mb-4 shadow-sm border-2 border-purple-100">
                      <p className="text-gray-800 text-base leading-relaxed font-medium">{aiRecommendation.analysisText}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendation.bestValue && (
                      <div className="bg-gradient-to-br from-green-100 to-green-50 p-4 rounded-xl border-2 border-green-200 shadow-md">
                        <Badge className="bg-green-600 text-white mb-2 px-3 py-1">
                          💰 Best Value
                        </Badge>
                        <p className="text-sm text-gray-700 mt-2">Most cost-effective option</p>
                      </div>
                    )}
                    {aiRecommendation.fastest && (
                      <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-xl border-2 border-blue-200 shadow-md">
                        <Badge className="bg-blue-600 text-white mb-2 px-3 py-1">
                          ⚡ Fastest Delivery
                        </Badge>
                        <p className="text-sm text-gray-700 mt-2">Quickest shipping available</p>
                      </div>
                    )}
                    {aiRecommendation.bestOverall && (
                      <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-4 rounded-xl border-2 border-purple-200 shadow-md">
                        <Badge className="bg-purple-600 text-white mb-2 px-3 py-1">
                          🤖 AI Recommended
                        </Badge>
                        <p className="text-sm text-gray-700 mt-2">Best balance of speed & cost</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filter Section - Full width at top */}
            <Card className="mb-6 shadow-lg border-0 bg-gray-50">
              <CardContent className="py-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter & Sort Options
                  </h3>
                  <EnhancedRateFilter
                    filters={{
                      search: '',
                      carriers: [],
                      maxPrice: undefined,
                      maxDays: undefined,
                      minPrice: undefined,
                      features: [],
                      sortBy: sortOrder === 'price' ? 'price' : sortOrder === 'speed' ? 'speed' : 'carrier',
                      sortOrder: 'asc',
                      selectedCarrier: carrierFilter
                    }}
                    availableCarriers={uniqueCarriers}
                    onFiltersChange={(newFilters) => {
                      setCarrierFilter(newFilters.selectedCarrier);
                      setSortOrder(newFilters.sortBy);
                    }}
                    onClearFilters={() => {
                      setCarrierFilter('all');
                      setSortOrder('price');
                    }}
                    onAIPoweredAnalysis={() => {
                      console.log('AI powered analysis triggered');
                    }}
                    rateCount={sortedRates.length}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-gray-700">Shipping Options</CardTitle>
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
                    <div 
                      key={rate.id} 
                      className="border-2 border-gray-200 hover:border-blue-300 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => handleRateClick(rate)}
                    >
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
                              <Badge className="bg-red-600 text-white text-xs font-bold shadow-lg">
                                🤖 AI RECOMMENDED
                              </Badge>
                            )}
                            {discountPercentage > 0 && (
                              <Badge className="bg-red-600 text-white text-xs font-bold shadow-lg">
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShipThis(rate);
                          }} 
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
          </>
        )}
      </div>
      
      {/* AI Rate Analysis Panel */}
      {showAIPanel && selectedRateForAI && (
        <AIRateAnalysisPanel
          selectedRate={selectedRateForAI}
          allRates={rates}
          isOpen={showAIPanel}
          onClose={() => setShowAIPanel(false)}
          onOptimizationChange={handleOptimizationChange}
        />
      )}
    </div>
  );
};

export default IndependentRateCalculator;

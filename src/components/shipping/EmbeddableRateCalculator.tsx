
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Package, MapPin, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import CarrierLogo from './CarrierLogo';
import ImprovedRateFilter from './ImprovedRateFilter';

interface RateResult {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  isAIRecommended?: boolean;
  isPremium?: boolean;
}

const EmbeddableRateCalculator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<RateResult[]>([]);
  const [filteredRates, setFilteredRates] = useState<RateResult[]>([]);
  const [formData, setFormData] = useState({
    fromZip: '',
    toZip: '',
    weight: '',
    length: '',
    width: '',
    height: ''
  });

  const [filters, setFilters] = useState({
    search: '',
    carriers: [] as string[],
    maxPrice: undefined as number | undefined,
    maxDays: undefined as number | undefined,
    features: [] as string[],
    sortBy: 'price' as 'price' | 'speed' | 'carrier' | 'reliability',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = (ratesToFilter: RateResult[]) => {
    let filtered = [...ratesToFilter];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(rate => 
        rate.carrier.toLowerCase().includes(searchTerm) ||
        rate.service.toLowerCase().includes(searchTerm)
      );
    }

    // Carrier filter
    if (filters.carriers.length > 0) {
      filtered = filtered.filter(rate => 
        filters.carriers.some(carrier => 
          rate.carrier.toLowerCase().includes(carrier.toLowerCase())
        )
      );
    }

    // Price filter
    if (filters.maxPrice) {
      filtered = filtered.filter(rate => parseFloat(rate.rate) <= filters.maxPrice!);
    }

    // Days filter
    if (filters.maxDays) {
      filtered = filtered.filter(rate => rate.delivery_days <= filters.maxDays!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'price':
          comparison = parseFloat(a.rate) - parseFloat(b.rate);
          break;
        case 'speed':
          comparison = a.delivery_days - b.delivery_days;
          break;
        case 'carrier':
          comparison = a.carrier.localeCompare(b.carrier);
          break;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  React.useEffect(() => {
    const filtered = applyFilters(rates);
    setFilteredRates(filtered);
  }, [rates, filters]);

  const handleCalculateRates = async () => {
    // Validate form
    if (!formData.fromZip || !formData.toZip || !formData.weight) {
      toast.error('Please fill in origin, destination, and weight');
      return;
    }

    setIsLoading(true);
    
    try {
      const fromAddress = {
        zip: formData.fromZip,
        country: 'US'
      };
      
      const toAddress = {
        zip: formData.toZip,
        country: 'US'
      };
      
      const parcel = {
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || 10,
        width: parseFloat(formData.width) || 8,
        height: parseFloat(formData.height) || 6
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel,
          carriers: ['USPS', 'UPS', 'FedEx', 'DHL']
        }
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to fetch rates. Please try again.');
        return;
      }

      if (data?.rates && data.rates.length > 0) {
        // Process rates with AI recommendations
        const processedRates = data.rates.map((rate: any, index: number) => ({
          ...rate,
          isAIRecommended: index < 2, // Mark first 2 as AI recommended
          isPremium: rate.delivery_days <= 2 || parseFloat(rate.rate) > 20
        }));
        
        setRates(processedRates);
        toast.success(`Found ${processedRates.length} shipping options!`);
      } else {
        setRates([]);
        toast.warning('No rates found for the given details.');
      }
    } catch (error) {
      console.error('Rate calculation error:', error);
      toast.error('An error occurred while calculating rates.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipWithRate = (rate: RateResult) => {
    // Auto-fill shipping form with rate calculator data
    const shippingData = {
      fromAddress: {
        zip: formData.fromZip,
        country: 'US'
      },
      toAddress: {
        zip: formData.toZip,
        country: 'US'
      },
      parcel: {
        weight: parseFloat(formData.weight),
        length: parseFloat(formData.length) || 10,
        width: parseFloat(formData.width) || 8,
        height: parseFloat(formData.height) || 6
      },
      selectedRate: rate
    };

    // Store in sessionStorage for auto-fill
    sessionStorage.setItem('rateCalculatorData', JSON.stringify(shippingData));
    
    // Dispatch event to auto-fill shipping form
    document.dispatchEvent(new CustomEvent('auto-fill-from-calculator', {
      detail: shippingData
    }));

    toast.success('Shipping form will be auto-filled with your selection!');
  };

  const uniqueCarriers = [...new Set(rates.map(rate => rate.carrier))];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Shipping Rate Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Address Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-green-600" />
                From ZIP Code
              </Label>
              <Input
                placeholder="90210"
                value={formData.fromZip}
                onChange={(e) => handleInputChange('fromZip', e.target.value)}
                maxLength={5}
                className="border-2 border-gray-200 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-medium">
                <MapPin className="w-4 h-4 text-red-600" />
                To ZIP Code
              </Label>
              <Input
                placeholder="10001"
                value={formData.toZip}
                onChange={(e) => handleInputChange('toZip', e.target.value)}
                maxLength={5}
                className="border-2 border-gray-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Package Section - All in one row */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 font-medium">
              <Package className="w-4 h-4 text-purple-600" />
              Package Details
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs text-gray-600 font-medium">Weight (lbs)</Label>
                <Input
                  placeholder="5.0"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 font-medium">Length (in)</Label>
                <Input
                  placeholder="10"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleInputChange('length', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 font-medium">Width (in)</Label>
                <Input
                  placeholder="8"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600 font-medium">Height (in)</Label>
                <Input
                  placeholder="6"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <Button
            onClick={handleCalculateRates}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Calculating Rates...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5 mr-2" />
                Get Shipping Rates
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      {rates.length > 0 && (
        <ImprovedRateFilter
          filters={filters}
          availableCarriers={uniqueCarriers}
          onFiltersChange={setFilters}
          onClearFilters={() => setFilters({
            search: '',
            carriers: [],
            maxPrice: undefined,
            maxDays: undefined,
            features: [],
            sortBy: 'price',
            sortOrder: 'asc'
          })}
          rateCount={filteredRates.length}
        />
      )}

      {/* Results */}
      {filteredRates.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-xl text-gray-900 flex items-center gap-2">
            Available Shipping Options
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filteredRates.length} option{filteredRates.length !== 1 ? 's' : ''}
            </Badge>
          </h3>
          
          <div className="grid gap-3">
            {filteredRates.map((rate, index) => (
              <Card
                key={rate.id || index}
                className={`border-2 hover:border-blue-300 transition-all duration-200 hover:shadow-md ${
                  rate.isAIRecommended ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CarrierLogo carrier={rate.carrier} className="w-12 h-12" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{rate.carrier}</span>
                          {rate.isAIRecommended && (
                            <Badge className="bg-purple-200 text-purple-800 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Pick
                            </Badge>
                          )}
                          {rate.isPremium && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <div className="font-medium text-gray-700">{rate.service}</div>
                        <div className="text-sm text-gray-600">
                          Delivery: {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </div>
                      <Button
                        onClick={() => handleShipWithRate(rate)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ship This
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddableRateCalculator;

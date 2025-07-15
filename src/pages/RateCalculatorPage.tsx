
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { GeocodingService } from '@/services/GeocodingService';
import PackageTypeSelector from '@/components/shipping/PackageTypeSelector';
import ShippingRateCard from '@/components/shipping/ShippingRateCard';
import { Loader, Calculator, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  original_rate?: string;
}

const RateCalculatorPage = () => {
  const navigate = useNavigate();
  const [originZip, setOriginZip] = useState('');
  const [destinationZip, setDestinationZip] = useState('');
  const [originCountry, setOriginCountry] = useState('US');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [packageType, setPackageType] = useState('box');
  const [weight, setWeight] = useState(1);
  const [weightUnit, setWeightUnit] = useState('lb');
  const [length, setLength] = useState(10);
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  const handleCalculateRates = async () => {
    if (!originZip || !destinationZip) {
      toast.error('Please enter both origin and destination zip codes');
      return;
    }

    setIsLoading(true);
    try {
      const fromAddress = await GeocodingService.generateAddressFromZip(originZip);
      const toAddress = await GeocodingService.generateAddressFromZip(destinationZip);

      if (originCountry !== 'US') {
        fromAddress.country = originCountry;
      }
      if (destinationCountry !== 'US') {
        toAddress.country = destinationCountry;
      }

      let weightOz = weight;
      if (weightUnit === 'kg') {
        weightOz = weight * 35.274;
      } else if (weightUnit === 'lb') {
        weightOz = weight * 16;
      }

      const payload = {
        fromAddress,
        toAddress,
        parcel: {
          length,
          width,
          height,
          weight: weightOz,
        },
        carriers: ['usps', 'ups', 'fedex', 'dhl'],
      };

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        const processedRates = data.rates.map(rate => {
          const discountPercentage = Math.random() * (90 - 85) + 85;
          const actualRate = parseFloat(rate.rate);
          const inflatedRate = (actualRate * (100 / (100 - discountPercentage))).toFixed(2);
          
          return {
            ...rate,
            original_rate: inflatedRate
          };
        });
        
        setRates(processedRates);
        toast.success('Rates calculated successfully!');
      }
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error('Failed to calculate rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateSelect = (rateId: string) => {
    setSelectedRateId(rateId);
    toast.success('Rate selected!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/create-label')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Shipping
            </Button>
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rate Calculator</h1>
                <p className="text-gray-600">Compare shipping rates across carriers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Calculator Form */}
          <div className="space-y-6">
            {/* Origin and Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Origin
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      value={originZip}
                      onChange={(e) => setOriginZip(e.target.value)}
                      placeholder="Enter origin zip code"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Select value={originCountry} onValueChange={setOriginCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Destination
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      value={destinationZip}
                      onChange={(e) => setDestinationZip(e.target.value)}
                      placeholder="Enter destination zip code"
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Package Details */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Package Details</h3>
              <div className="space-y-4">
                <div>
                  <Label>Package Type</Label>
                  <PackageTypeSelector
                    value={packageType}
                    onChange={setPackageType}
                  />
                </div>

                {(packageType === 'box' || packageType === 'envelope') && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Length (in)</Label>
                      <Input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label>Width (in)</Label>
                      <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        min="1"
                      />
                    </div>
                    {packageType === 'box' && (
                      <div>
                        <Label>Height (in)</Label>
                        <Input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          min="1"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Weight</Label>
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Select value={weightUnit} onValueChange={setWeightUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                        <SelectItem value="lb">Pounds (lb)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Calculate Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleCalculateRates}
                disabled={isLoading}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5 mr-2" />
                    Calculate Rates
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {rates.length > 0 ? (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-6">Available Rates</h3>
                <div className="space-y-4">
                  {rates.map((rate, index) => (
                    <ShippingRateCard
                      key={rate.id}
                      rate={rate}
                      isSelected={selectedRateId === rate.id}
                      onSelect={handleRateSelect}
                      showDiscount={true}
                      originalRate={rate.original_rate}
                      showPayButton={false}
                      isBestValue={index === 0}
                      isFastest={false}
                    />
                  ))}
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Ready to Calculate Rates
                </h3>
                <p className="text-gray-500">
                  Fill in the form on the left and click "Calculate Rates" to see available shipping options.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCalculatorPage;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Package, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { GeocodingService } from '@/services/GeocodingService';
import useRateCalculator from '@/hooks/useRateCalculator';
import { countries } from '@/lib/countries';

const IndependentRateCalculator = () => {
  const [fromCountry, setFromCountry] = useState('US');
  const [fromZip, setFromZip] = useState('');
  const [toCountry, setToCountry] = useState('CA');
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  const { fetchRates, isLoading, aiRecommendation, isAiLoading, selectRateAndProceed } = useRateCalculator();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromZip || !toZip || !weight || !length || !width || !height) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const fromAddress = await GeocodingService.generateAddressFromZip(fromZip);
      const toAddress = await GeocodingService.generateAddressFromZip(toZip);
      
      if (!fromAddress || !toAddress) {
        toast.error('Unable to validate addresses. Please check the zip codes.');
        return;
      }

      const requestData = {
        fromAddress: {
          ...fromAddress,
          name: 'Rate Calculator'
        },
        toAddress: {
          ...toAddress,
          name: 'Rate Calculator'
        },
        parcel: {
          weight: parseFloat(weight) * 16, // Convert lbs to oz
          length: parseFloat(length),
          width: parseFloat(width),
          height: parseFloat(height),
        },
        carriers: ['usps', 'ups', 'fedex', 'dhl']
      };

      await fetchRates(requestData);
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error('Failed to calculate rates. Please try again.');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          International Shipping Rate Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Origin Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Origin</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCountry">Country</Label>
                <Select value={fromCountry} onValueChange={setFromCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
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
              <div className="space-y-2">
                <Label htmlFor="fromZip">Postal Code</Label>
                <Input
                  id="fromZip"
                  value={fromZip}
                  onChange={(e) => setFromZip(e.target.value)}
                  placeholder="Enter postal code"
                  required
                />
              </div>
            </div>
          </div>

          {/* Destination Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Destination</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="toCountry">Country</Label>
                <Select value={toCountry} onValueChange={setToCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
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
              <div className="space-y-2">
                <Label htmlFor="toZip">Postal Code</Label>
                <Input
                  id="toZip"
                  value={toZip}
                  onChange={(e) => setToZip(e.target.value)}
                  placeholder="Enter postal code"
                  required
                />
              </div>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Package Details</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight in pounds"
                required
              />
            </div>

            {/* Dimensions in a single row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Length"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Width"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height"
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating Rates...
              </>
            ) : (
              'Calculate Shipping Rates'
            )}
          </Button>
        </form>

        {/* AI Recommendation Section */}
        {aiRecommendation && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">AI Recommendation</h3>
            <p>{aiRecommendation.analysisText}</p>
            <div className="mt-4">
              {aiRecommendation.bestOverall && (
                <Button variant="outline" onClick={() => selectRateAndProceed(aiRecommendation.bestOverall!)}>
                  Select Best Overall
                </Button>
              )}
              {aiRecommendation.bestValue && (
                <Button variant="outline" onClick={() => selectRateAndProceed(aiRecommendation.bestValue!)}>
                  Select Best Value
                </Button>
              )}
              {aiRecommendation.fastest && (
                <Button variant="outline" onClick={() => selectRateAndProceed(aiRecommendation.fastest!)}>
                  Select Fastest
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IndependentRateCalculator;

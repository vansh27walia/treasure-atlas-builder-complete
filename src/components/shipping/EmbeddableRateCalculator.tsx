
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Package } from 'lucide-react';
import { GeocodingService, GeneratedAddress } from '@/services/GeocodingService';
import useRateCalculator from '@/hooks/useRateCalculator';
import countries from 'country-list';

const EmbeddableRateCalculator = () => {
  const [fromZip, setFromZip] = useState('');
  const [fromCountry, setFromCountry] = useState('US');
  const [toZip, setToZip] = useState('');
  const [toCountry, setToCountry] = useState('US');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  const { fetchRates, aiRecommendation, isLoading, isAiLoading, selectRateAndProceed } = useRateCalculator();

  // Get country data for dropdown
  const countryData = countries.getData();

  const handleCalculate = async () => {
    if (!fromZip.trim() || !toZip.trim()) {
      return;
    }

    if (!weight || !length || !width || !height) {
      return;
    }

    try {
      // Generate addresses using geocoding service
      const fromAddress: GeneratedAddress = await GeocodingService.generateAddressFromZip(fromZip.trim());
      const toAddress: GeneratedAddress = await GeocodingService.generateAddressFromZip(toZip.trim());

      const parcelData = {
        weight: parseFloat(weight),
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height)
      };

      const requestData = {
        fromAddress,
        toAddress,
        parcel: parcelData,
        carriers: ['USPS', 'UPS', 'FedEx']
      };

      await fetchRates(requestData);

    } catch (error) {
      console.error('Error calculating rates:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          Shipping Rate Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Origin Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fromZip">Origin Zip Code</Label>
            <Input
              id="fromZip"
              placeholder="Enter zip code"
              value={fromZip}
              onChange={(e) => setFromZip(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="fromCountry">Origin Country</Label>
            <Select value={fromCountry} onValueChange={setFromCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryData.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Destination Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="toZip">Destination Zip Code</Label>
            <Input
              id="toZip"
              placeholder="Enter zip code"
              value={toZip}
              onChange={(e) => setToZip(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="toCountry">Destination Country</Label>
            <Select value={toCountry} onValueChange={setToCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryData.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Package Dimensions */}
        <div className="space-y-4">
          <Label className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Package Details
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="length">Length (in)</Label>
              <Input
                id="length"
                type="number"
                placeholder="0.0"
                value={length}
                onChange={(e) => setLength(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="width">Width (in)</Label>
              <Input
                id="width"
                type="number"
                placeholder="0.0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="height">Height (in)</Label>
              <Input
                id="height"
                type="number"
                placeholder="0.0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={handleCalculate}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Calculating...' : 'Calculate Shipping Rates'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmbeddableRateCalculator;

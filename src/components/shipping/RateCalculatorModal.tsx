
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { GeocodingService } from '@/services/GeocodingService';
import PackageTypeSelector from './PackageTypeSelector';
import ShippingRateCard from './ShippingRateCard';
import { Loader, Calculator, MapPin } from 'lucide-react';

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({ isOpen, onClose }) => {
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
      // Generate addresses from zip codes using Google Maps API
      const fromAddress = await GeocodingService.generateAddressFromZip(originZip);
      const toAddress = await GeocodingService.generateAddressFromZip(destinationZip);

      // Override countries if different from US
      if (originCountry !== 'US') {
        fromAddress.country = originCountry;
      }
      if (destinationCountry !== 'US') {
        toAddress.country = destinationCountry;
      }

      // Convert weight to ounces
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

      console.log('Rate Calculator payload:', payload);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error fetching rates: ${error.message}`);
      }

      if (data.rates && Array.isArray(data.rates)) {
        // Process rates with enhanced pricing
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
    // Store the rate calculation data for potential transfer to main shipping
    const calculatorData = {
      originZip,
      destinationZip,
      originCountry,
      destinationCountry,
      packageType,
      weight,
      weightUnit,
      dimensions: { length, width, height },
      selectedRateId: rateId,
      rates
    };
    sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
    toast.success('Rate selected! You can transfer this to main shipping if needed.');
  };

  const handleTransferToShipping = () => {
    if (!selectedRateId) {
      toast.error('Please select a rate first');
      return;
    }
    
    // Set a flag to indicate data should be transferred
    sessionStorage.setItem('transferToShipping', 'true');
    toast.success('Data prepared for transfer to main shipping form');
    onClose();
  };

  const handleModalClose = () => {
    // Reset all form data
    setOriginZip('');
    setDestinationZip('');
    setOriginCountry('US');
    setDestinationCountry('US');
    setPackageType('box');
    setWeight(1);
    setWeightUnit('lb');
    setLength(10);
    setWidth(10);
    setHeight(5);
    setRates([]);
    setSelectedRateId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="w-6 h-6 text-blue-600" />
            Rate Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Origin and Destination */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Origin
              </h3>
              <div className="space-y-3">
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

            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Destination
              </h3>
              <div className="space-y-3">
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
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3">Package Details</h3>
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
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

          {/* Results */}
          {rates.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-4">Available Rates</h3>
              <div className="space-y-3">
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
              
              {selectedRateId && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleTransferToShipping}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Transfer to Main Shipping
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RateCalculatorModal;

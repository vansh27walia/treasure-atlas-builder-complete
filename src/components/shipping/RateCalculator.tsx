
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, DollarSign, Clock, Truck } from 'lucide-react';
import CountrySelector from './CountrySelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from './CarrierLogo';
import { standardizeCarrierName } from '@/utils/carrierUtils';

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 8, etc.

interface RateCalculatorProps {
  className?: string;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days?: number;
  original_rate?: string;
  discount_percentage?: number;
}

const RateCalculator: React.FC<RateCalculatorProps> = ({ className = '' }) => {
  const [fromAddress, setFromAddress] = useState({
    zip: '',
    country: 'US'
  });
  
  const [toAddress, setToAddress] = useState({
    zip: '',
    country: 'US'
  });
  
  const [packageDetails, setPackageDetails] = useState({
    weight: '',
    length: '',
    width: '',
    height: ''
  });
  
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Apply markup to rates
  const applyRateMarkup = (originalRate: number): number => {
    const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
    return originalRate + markupAmount;
  };

  const handleCalculateRates = async () => {
    if (!fromAddress.zip || !toAddress.zip || !packageDetails.weight) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCalculating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: {
            zip: fromAddress.zip,
            country: fromAddress.country
          },
          toAddress: {
            zip: toAddress.zip,
            country: toAddress.country
          },
          parcel: {
            weight: parseFloat(packageDetails.weight),
            length: packageDetails.length ? parseFloat(packageDetails.length) : 8,
            width: packageDetails.width ? parseFloat(packageDetails.width) : 6,
            height: packageDetails.height ? parseFloat(packageDetails.height) : 4
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.rates) {
        // Apply markup to rates
        const processedRates = data.rates.map((rate: any) => {
          const originalRate = parseFloat(rate.rate);
          const markedUpRate = applyRateMarkup(originalRate);
          
          return {
            ...rate,
            rate: markedUpRate.toFixed(2),
            original_rate: originalRate.toFixed(2),
            markup_percentage: RATE_MARKUP_PERCENTAGE
          };
        });
        
        setRates(processedRates);
        toast.success(`Found ${processedRates.length} shipping rates with ${RATE_MARKUP_PERCENTAGE}% markup`);
      } else {
        setRates([]);
        toast.warning('No rates found for this shipment');
      }
      
    } catch (error) {
      console.error('Error calculating rates:', error);
      toast.error('Failed to calculate shipping rates');
      setRates([]);
    } finally {
      setIsCalculating(false);
    }
  };

  const getDiscountPercentage = (rate: ShippingRate) => {
    if (rate.original_rate && rate.rate) {
      const originalRate = parseFloat(rate.original_rate);
      const discountedRate = parseFloat(rate.rate);
      const discount = ((originalRate - discountedRate) / originalRate) * 100;
      return Math.round(discount);
    }
    return rate.discount_percentage || 0;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Rate Calculator
          </CardTitle>
          <CardDescription>
            Calculate shipping rates between any two locations with {RATE_MARKUP_PERCENTAGE}% markup included
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Address */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium">From Address</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromZip">ZIP Code</Label>
                <Input
                  id="fromZip"
                  placeholder="Enter ZIP code"
                  value={fromAddress.zip}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, zip: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="fromCountry">Country</Label>
                <CountrySelector
                  value={fromAddress.country}
                  onValueChange={(value) => setFromAddress(prev => ({ ...prev, country: value }))}
                  placeholder="Select country"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* To Address */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <Label className="text-sm font-medium">To Address</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toZip">ZIP Code</Label>
                <Input
                  id="toZip"
                  placeholder="Enter ZIP code"
                  value={toAddress.zip}
                  onChange={(e) => setToAddress(prev => ({ ...prev, zip: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="toCountry">Country</Label>
                <CountrySelector
                  value={toAddress.country}
                  onValueChange={(value) => setToAddress(prev => ({ ...prev, country: value }))}
                  placeholder="Select country"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-purple-600" />
              <Label className="text-sm font-medium">Package Details</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs) *</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Enter weight"
                  value={packageDetails.weight}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, weight: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="length">Length (inches)</Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="8"
                  value={packageDetails.length}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, length: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (inches)</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="6"
                  value={packageDetails.width}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, width: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (inches)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="4"
                  value={packageDetails.height}
                  onChange={(e) => setPackageDetails(prev => ({ ...prev, height: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCalculateRates} 
            disabled={isCalculating}
            className="w-full"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Rates'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Shipping Rates (with {RATE_MARKUP_PERCENTAGE}% markup)
            </CardTitle>
            <CardDescription>
              Found {rates.length} available shipping options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rates.map((rate) => {
                const standardizedCarrier = standardizeCarrierName(rate.carrier);
                const discountPercent = getDiscountPercentage(rate);
                
                return (
                  <div
                    key={rate.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <CarrierLogo carrier={standardizedCarrier} className="w-8 h-8" />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {standardizedCarrier}
                        </div>
                        <div className="text-sm text-gray-600">
                          {rate.service}
                        </div>
                        {rate.delivery_days && (
                          <div className="flex items-center text-xs text-blue-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {rate.delivery_days} business days
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {discountPercent > 0 && (
                        <div className="text-xs font-bold text-red-600 mb-1">
                          {discountPercent}% OFF
                        </div>
                      )}
                      <div className="text-lg font-bold text-green-600">
                        ${rate.rate}
                      </div>
                      {rate.original_rate && parseFloat(rate.original_rate) > parseFloat(rate.rate) && (
                        <div className="text-xs text-gray-500 line-through">
                          ${rate.original_rate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RateCalculator;

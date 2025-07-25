
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingDown, Clock, DollarSign, Shield } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days?: number;
  delivery_date?: string;
  list_rate?: string;
  retail_rate?: string;
  original_rate?: string;
  isPremium?: boolean;
  discount_percentage?: number;
}

interface RateDisplayProps {
  rates: ShippingRate[];
  selectedRateId: string | null;
  onRateSelect: (rateId: string) => void;
  onAISuggestionOpen: (rate: ShippingRate) => void;
  carrierFilter: string;
  isBestValue: (rateId: string) => boolean;
  isFastest: (rateId: string) => boolean;
}

const getCarrierLogo = (carrier: string) => {
  const carrierUpper = carrier.toUpperCase();
  
  switch (carrierUpper) {
    case 'UPS':
      return (
        <div className="w-16 h-10 bg-amber-600 flex items-center justify-center rounded">
          <span className="text-white font-bold text-sm">UPS</span>
        </div>
      );
    case 'USPS':
      return (
        <div className="w-16 h-10 bg-blue-600 flex items-center justify-center rounded">
          <span className="text-white font-bold text-sm">USPS</span>
        </div>
      );
    case 'FEDEX':
      return (
        <div className="w-16 h-10 bg-purple-600 flex items-center justify-center rounded">
          <span className="text-white font-bold text-sm">FedEx</span>
        </div>
      );
    case 'DHL':
      return (
        <div className="w-16 h-10 bg-red-600 flex items-center justify-center rounded">
          <span className="text-white font-bold text-sm">DHL</span>
        </div>
      );
    default:
      return (
        <div className="w-16 h-10 bg-gray-600 flex items-center justify-center rounded">
          <span className="text-white font-bold text-sm">{carrierUpper.slice(0, 3)}</span>
        </div>
      );
  }
};

const RateDisplayWithLogos: React.FC<RateDisplayProps> = ({
  rates,
  selectedRateId,
  onRateSelect,
  onAISuggestionOpen,
  carrierFilter,
  isBestValue,
  isFastest
}) => {
  // Filter rates based on carrier filter
  const filteredRates = carrierFilter === 'all' 
    ? rates 
    : rates.filter(rate => rate.carrier.toLowerCase() === carrierFilter.toLowerCase());

  const handleRateClick = (rate: ShippingRate) => {
    onRateSelect(rate.id);
    onAISuggestionOpen(rate);
    toast.success(`Selected ${rate.carrier} ${rate.service}`);
  };

  if (filteredRates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          {carrierFilter === 'all' 
            ? 'No rates available' 
            : `No rates available for ${carrierFilter.toUpperCase()}`}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredRates.map((rate) => {
        const isSelected = selectedRateId === rate.id;
        const deliveryDays = rate.delivery_days;
        const deliveryEstimate = deliveryDays === 1 ? 'Next day' : deliveryDays ? `${deliveryDays} days` : 'N/A';
        const hasDiscount = rate.discount_percentage && rate.discount_percentage > 0;
        
        return (
          <Card
            key={rate.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleRateClick(rate)}
            data-testid={`rate-card-${rate.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Carrier Logo */}
                {getCarrierLogo(rate.carrier)}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg">{rate.carrier.toUpperCase()}</h3>
                    {isSelected && (
                      <div className="bg-blue-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{rate.service}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  {hasDiscount && rate.original_rate && (
                    <span className="text-sm text-gray-500 line-through">
                      ${parseFloat(rate.original_rate).toFixed(2)}
                    </span>
                  )}
                  <span className="font-bold text-xl">
                    ${parseFloat(rate.rate).toFixed(2)}
                  </span>
                </div>
                {hasDiscount && (
                  <span className="text-xs font-medium text-green-600">
                    Save {rate.discount_percentage}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {isBestValue(rate.id) && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                )}
                
                {isFastest(rate.id) && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <Zap className="h-3 w-3 mr-1" />
                    Fastest
                  </Badge>
                )}
                
                {rate.isPremium && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                    <Shield className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{deliveryEstimate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${parseFloat(rate.rate).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default RateDisplayWithLogos;


import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface EnhancedRateDisplayProps {
  actualRate: string;
  carrier: string;
  service: string;
  deliveryDays?: number;
  baseRate?: string; // For comparison to show increase/decrease
  isRecommended?: boolean;
  isSelected?: boolean;
}

const EnhancedRateDisplay: React.FC<EnhancedRateDisplayProps> = ({
  actualRate,
  carrier,
  service,
  deliveryDays,
  baseRate,
  isRecommended = false,
  isSelected = false
}) => {
  const rate = parseFloat(actualRate);
  const base = baseRate ? parseFloat(baseRate) : null;
  
  // Calculate percentage change if base rate exists
  const percentageChange = base && base !== rate ? ((rate - base) / base) * 100 : null;
  const isIncrease = percentageChange && percentageChange > 0;
  const isDecrease = percentageChange && percentageChange < 0;

  // Get carrier color theme
  const getCarrierTheme = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'ups':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'fedex':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'usps':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'dhl':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-3 rounded-lg border-2 transition-all duration-200 ${
      isSelected 
        ? 'border-green-500 bg-green-50 shadow-md' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4 text-gray-600" />
          <Badge className={getCarrierTheme(carrier)}>
            {carrier}
          </Badge>
          {isRecommended && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              AI Recommended
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {percentageChange !== null && (
            <div className={`flex items-center text-xs ${
              isIncrease ? 'text-red-600' : isDecrease ? 'text-green-600' : 'text-gray-600'
            }`}>
              {isIncrease && <TrendingUp className="h-3 w-3 mr-1" />}
              {isDecrease && <TrendingDown className="h-3 w-3 mr-1" />}
              {isIncrease && '+'}
              {percentageChange.toFixed(1)}%
            </div>
          )}
          
          <div className="flex items-center text-lg font-bold text-gray-900">
            <DollarSign className="h-4 w-4" />
            {rate.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-700 font-medium">
          {service}
        </div>
        
        {deliveryDays && (
          <div className="flex items-center text-gray-600">
            <Clock className="h-3 w-3 mr-1" />
            {deliveryDays === 1 ? '1 day' : `${deliveryDays} days`}
          </div>
        )}
      </div>
      
      {percentageChange !== null && base && (
        <div className="mt-2 text-xs text-gray-500">
          Base rate: ${base.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default EnhancedRateDisplay;

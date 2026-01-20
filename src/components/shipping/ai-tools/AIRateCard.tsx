import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, Star, Check, Zap } from 'lucide-react';

interface RateData {
  carrier_name: string;
  service_type?: string;
  price: number;
  delivery_days?: number;
  isBestValue?: boolean;
  isFastest?: boolean;
  isCheapest?: boolean;
}

interface AIRateCardProps {
  rate: RateData;
  onSelect?: (rate: RateData) => void;
  isSelected?: boolean;
}

const AIRateCard: React.FC<AIRateCardProps> = ({ rate, onSelect, isSelected }) => {
  const getCarrierColor = (carrier: string) => {
    const colors: Record<string, string> = {
      'UPS': 'from-amber-600 to-amber-700',
      'USPS': 'from-blue-600 to-blue-700',
      'FedEx': 'from-purple-600 to-purple-700',
      'DHL': 'from-yellow-500 to-red-500',
    };
    return colors[carrier] || 'from-gray-600 to-gray-700';
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
        isSelected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:scale-[1.02]'
      }`}
      onClick={() => onSelect?.(rate)}
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 flex gap-1">
        {rate.isCheapest && (
          <Badge className="bg-green-500 text-white text-[10px]">
            <Zap className="w-3 h-3 mr-0.5" /> Cheapest
          </Badge>
        )}
        {rate.isFastest && (
          <Badge className="bg-blue-500 text-white text-[10px]">
            <Clock className="w-3 h-3 mr-0.5" /> Fastest
          </Badge>
        )}
        {rate.isBestValue && (
          <Badge className="bg-purple-500 text-white text-[10px]">
            <Star className="w-3 h-3 mr-0.5" /> Best Value
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Carrier Icon */}
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCarrierColor(rate.carrier_name)} flex items-center justify-center`}>
            <Truck className="w-6 h-6 text-white" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">{rate.carrier_name}</h4>
              {isSelected && <Check className="w-4 h-4 text-green-500" />}
            </div>
            <p className="text-sm text-gray-500">{rate.service_type || 'Standard Service'}</p>
            {rate.delivery_days && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                {rate.delivery_days} {rate.delivery_days === 1 ? 'day' : 'days'} delivery
              </p>
            )}
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">${rate.price.toFixed(2)}</p>
            <Button 
              size="sm" 
              className={`mt-2 ${isSelected ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-600 hover:bg-purple-700'}`}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRateCard;

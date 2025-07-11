
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Star, Check } from 'lucide-react';
import CarrierLogo from './CarrierLogo';
import { ShippingRate } from '@/types/shipping';

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (rateId: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  showDiscount?: boolean;
  showPayButton?: boolean;
  shippingDetails?: any;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  isBestValue = false,
  isFastest = false,
  showDiscount = false,
  showPayButton = false,
  shippingDetails
}) => {
  const handleSelect = () => {
    onSelect(rate.id);
  };

  const formatDeliveryTime = (days: number) => {
    if (days === 1) return '1 business day';
    if (days <= 7) return `${days} business days`;
    return `${Math.ceil(days / 7)} weeks`;
  };

  return (
    <Card className={`cursor-pointer transition-all duration-200 ${
      isSelected 
        ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <CarrierLogo carrier={rate.carrier} size="md" />
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{rate.carrier.toUpperCase()}</h3>
                {isBestValue && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Star className="w-3 h-3 mr-1" />
                    Best Value
                  </Badge>
                )}
                {isFastest && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Fastest
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-1">{rate.service}</p>
              
              {rate.delivery_days && (
                <p className="text-xs text-gray-500">
                  Estimated delivery: {formatDeliveryTime(rate.delivery_days)}
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ${parseFloat(rate.rate).toFixed(2)}
            </div>
            
            <Button
              onClick={handleSelect}
              variant={isSelected ? "default" : "outline"}
              className={`mt-2 ${
                isSelected 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingRateCard;

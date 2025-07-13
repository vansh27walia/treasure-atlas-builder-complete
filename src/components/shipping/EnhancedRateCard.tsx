
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, Star, Zap } from 'lucide-react';

interface EnhancedRateCardProps {
  rate: any;
  isSelected: boolean;
  onSelect: (rateId: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  showDiscount?: boolean;
  originalRate?: string;
}

const EnhancedRateCard: React.FC<EnhancedRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  isBestValue,
  isFastest,
  showDiscount,
  originalRate
}) => {
  const getCarrierLogo = (carrier: string) => {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) return '🇺🇸';
    if (carrierLower.includes('ups')) return '🤎';
    if (carrierLower.includes('fedex')) return '💜';
    if (carrierLower.includes('dhl')) return '🟡';
    return '📦';
  };

  const getCarrierGradient = (carrier: string) => {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) return 'from-red-500 to-blue-600';
    if (carrierLower.includes('ups')) return 'from-yellow-600 to-yellow-800';
    if (carrierLower.includes('fedex')) return 'from-purple-600 to-orange-500';
    if (carrierLower.includes('dhl')) return 'from-yellow-400 to-red-500';
    return 'from-blue-500 to-purple-600';
  };

  const discountPercentage = showDiscount && originalRate 
    ? Math.round(((parseFloat(originalRate) - parseFloat(rate.rate)) / parseFloat(originalRate)) * 100)
    : 0;

  return (
    <Card className={`relative group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer bg-white/80 backdrop-blur-sm border-2 overflow-hidden
      ${isSelected 
        ? 'border-blue-500 shadow-2xl ring-4 ring-blue-200/50 bg-gradient-to-br from-blue-50/80 to-white/80' 
        : 'border-gray-200 hover:border-blue-300'
      }`}
      onClick={() => onSelect(rate.id)}
    >
      {/* Header with Carrier Logo */}
      <div className={`h-16 bg-gradient-to-r ${getCarrierGradient(rate.carrier)} flex items-center px-4`}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <span className="text-2xl">{getCarrierLogo(rate.carrier)}</span>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{rate.carrier.toUpperCase()}</h3>
            <p className="text-white/80 text-sm font-medium">{rate.service}</p>
          </div>
        </div>
        
        {/* Badges */}
        <div className="ml-auto flex flex-col space-y-1">
          {isBestValue && (
            <Badge className="bg-green-500 text-white text-xs px-2 py-1 flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          )}
          {isFastest && (
            <Badge className="bg-orange-500 text-white text-xs px-2 py-1 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              Fastest
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Price Section */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">${rate.rate}</span>
              {showDiscount && originalRate && discountPercentage > 0 && (
                <div className="flex flex-col items-start">
                  <span className="text-sm text-gray-500 line-through">${originalRate}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    -{discountPercentage}% OFF
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {rate.insurance_cost > 0 && `Includes $${rate.insurance_cost} insurance`}
            </p>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-gray-700">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">
                {rate.delivery_days ? `${rate.delivery_days} business days` : 'Delivery time varies'}
              </p>
              {rate.delivery_date && (
                <p className="text-sm text-gray-500">
                  Expected: {new Date(rate.delivery_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {rate.insurance_cost > 0 && (
            <div className="flex items-center space-x-3 text-gray-700">
              <Shield className="w-5 h-5 text-green-600" />
              <p className="text-sm">Package protection included</p>
            </div>
          )}
        </div>

        {/* Select Button */}
        <Button 
          className={`w-full h-12 font-semibold transition-all duration-200 ${
            isSelected 
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
              : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-300 hover:border-blue-300'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(rate.id);
          }}
        >
          {isSelected ? 'Selected ✓' : 'Select This Rate'}
        </Button>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedRateCard;

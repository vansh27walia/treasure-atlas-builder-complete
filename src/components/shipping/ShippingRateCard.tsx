
import React from 'react';
import { Clock, Check, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
  shipment_id?: string;
  original_rate?: string;
}

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (rateId: string) => void;
  isBestValue: boolean;
  isFastest: boolean;
  aiRecommendation?: {
    bestOverall: string | null;
    bestValue: string | null;
    fastest: string | null;
    mostReliable: string | null;
    analysisText: string;
  };
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  isBestValue,
  isFastest,
  aiRecommendation,
}) => {
  const formattedRate = parseFloat(rate.rate).toFixed(2);
  const formattedOriginalRate = rate.list_rate 
    ? parseFloat(rate.list_rate).toFixed(2) 
    : null;
  const discount = formattedOriginalRate 
    ? ((parseFloat(rate.list_rate!) - parseFloat(rate.rate)) / parseFloat(rate.list_rate!) * 100).toFixed(0)
    : null;
    
  const isRecommended = aiRecommendation?.bestOverall === rate.id;
  
  // Get carrier logo
  const getCarrierLogo = (carrier: string) => {
    // Normalize carrier name to lowercase for comparison
    const carrierLower = carrier.toLowerCase();
    
    if (carrierLower.includes('usps')) {
      return '/assets/carriers/usps-logo.png';
    } else if (carrierLower.includes('ups')) {
      return '/assets/carriers/ups-logo.png';
    } else if (carrierLower.includes('fedex')) {
      return '/assets/carriers/fedex-logo.png';
    } else if (carrierLower.includes('dhl')) {
      return '/assets/carriers/dhl-logo.png';
    }
    
    return null;
  };
  
  const carrierLogo = getCarrierLogo(rate.carrier);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-200",
        isSelected 
          ? "border-2 border-blue-500 shadow-md bg-blue-50" 
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
      data-rate-id={rate.id}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Carrier logo */}
            {carrierLogo && (
              <div className="w-14 h-10 flex items-center justify-center bg-white rounded border border-gray-100 p-1">
                <img 
                  src={carrierLogo} 
                  alt={`${rate.carrier} logo`} 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900">{rate.carrier}</h3>
              <p className="text-sm text-gray-600">{rate.service}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-1">
                {isRecommended && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    AI Recommended
                  </Badge>
                )}
                {isBestValue && !isRecommended && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Best Value
                  </Badge>
                )}
                {isFastest && !isRecommended && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                    Fastest
                  </Badge>
                )}
                {discount && parseFloat(discount) > 0 && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    Save {discount}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 ml-auto">
            <div className="text-right">
              <div className="flex items-center justify-end">
                <Clock className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {rate.delivery_days === 1 
                    ? '1 day' 
                    : `${rate.delivery_days} days`}
                </span>
              </div>
              <div className="mt-1">
                {formattedOriginalRate && parseFloat(formattedOriginalRate) > parseFloat(formattedRate) && (
                  <span className="text-sm text-gray-400 line-through mr-1">
                    ${formattedOriginalRate}
                  </span>
                )}
                <span className="text-xl font-semibold text-gray-900">
                  ${formattedRate}
                </span>
              </div>
            </div>
            
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={cn(
                "min-w-[100px]",
                isSelected ? "bg-blue-600 hover:bg-blue-700" : ""
              )}
              onClick={() => onSelect(rate.id)}
            >
              {isSelected ? (
                <>
                  <Check className="mr-1 h-4 w-4" /> Selected
                </>
              ) : "Select"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingRateCard;

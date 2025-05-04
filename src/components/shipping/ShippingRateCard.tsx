
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, DollarSign, Award, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

interface AIRecommendation {
  bestOverall: string | null;
  bestValue: string | null;
  fastest: string | null;
  mostReliable: string | null;
  analysisText?: string;
}

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  aiRecommendation?: AIRecommendation;
}

const getCarrierLogo = (carrier: string) => {
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
  
  // Default logo
  return null;
};

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({ 
  rate, 
  isSelected, 
  onSelect, 
  isBestValue,
  isFastest,
  aiRecommendation 
}) => {
  const formattedRate = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: rate.currency || 'USD'
  }).format(parseFloat(rate.rate));
  
  const formatDeliveryDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const logo = getCarrierLogo(rate.carrier);
  const isAiBestOverall = aiRecommendation?.bestOverall === rate.id;
  const isAiBestValue = aiRecommendation?.bestValue === rate.id;
  const isAiFastest = aiRecommendation?.fastest === rate.id;
  const isAiMostReliable = aiRecommendation?.mostReliable === rate.id;

  return (
    <Card 
      className={cn(
        "border p-4 transition-all",
        isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 hover:border-blue-300",
        isAiBestOverall ? "border-purple-300 bg-purple-50" : "",
      )}
      onClick={() => onSelect(rate.id)}
      data-rate-id={rate.id}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
          {logo ? (
            <div className="w-16 h-16 flex items-center justify-center bg-white rounded-md p-2 border">
              <img 
                src={logo} 
                alt={`${rate.carrier} logo`} 
                className="max-w-full max-h-full object-contain" 
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-md">
              <span className="text-sm font-medium text-center">{rate.carrier}</span>
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{rate.service}</h3>
            <p className="text-sm text-gray-600">{rate.carrier}</p>
            
            <div className="mt-1 flex flex-wrap gap-2">
              {isBestValue && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Best Value
                </Badge>
              )}
              
              {isFastest && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Fastest
                </Badge>
              )}
              
              {isAiBestOverall && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Award className="h-3 w-3 mr-1" />
                  AI Recommended
                </Badge>
              )}
              
              {isAiMostReliable && !isAiBestOverall && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Shield className="h-3 w-3 mr-1" />
                  Most Reliable
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-xl font-semibold text-blue-700">{formattedRate}</div>
          
          <div className="text-sm text-gray-600 flex items-center mt-1">
            {rate.delivery_days ? (
              <>
                <Clock className="h-4 w-4 mr-1" />
                {rate.delivery_days === 1 
                  ? '1 day delivery' 
                  : `${rate.delivery_days} days`}
              </>
            ) : rate.delivery_date ? (
              <>
                <Clock className="h-4 w-4 mr-1" />
                {formatDeliveryDate(rate.delivery_date)}
              </>
            ) : null}
          </div>
          
          {isSelected && (
            <Badge className="mt-2 bg-blue-500">
              <Check className="h-3.5 w-3.5 mr-1" />
              Selected
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ShippingRateCard;

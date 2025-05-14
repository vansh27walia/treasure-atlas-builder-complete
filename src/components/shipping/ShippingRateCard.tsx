
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShippingOption } from '@/types/shipping';
import { CheckCircle, Award, Timer, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingRateCardProps {
  rate: ShippingOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  aiRecommendation?: {
    rateId: string;
    reason: string;
  };
  showDiscount?: boolean;
  originalRate?: number;
  isPremium?: boolean;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  isBestValue = false,
  isFastest = false,
  aiRecommendation,
  showDiscount = false,
  originalRate,
  isPremium = false,
}) => {
  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    onSelect(rate.id);
  };

  const isRecommended = aiRecommendation?.rateId === rate.id;
  const estimatedDays = rate.delivery_days ?? '?';
  const deliveryEstimate = estimatedDays === 1 
    ? 'Tomorrow'
    : estimatedDays === 2
      ? 'In 2 days'
      : estimatedDays === '?'
        ? 'Delivery time unknown'
        : `In ${estimatedDays} days`;

  const carrierLogo = getCarrierLogo(rate.carrier.toLowerCase());
  const discount = showDiscount && originalRate ? Math.round(((originalRate - rate.rate) / originalRate) * 100) : 0;
  const hasDiscount = discount > 0;

  return (
    <Card
      onClick={handleSelect}
      className={cn(
        'relative cursor-pointer transition-all overflow-hidden border border-gray-200',
        isSelected ? 'ring-2 ring-blue-500 shadow-md bg-blue-50/70' : 'hover:border-blue-300 hover:shadow-sm',
        isPremium ? 'bg-amber-50/50 border-amber-200' : ''
      )}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {carrierLogo && (
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src={carrierLogo} 
                  alt={`${rate.carrier} logo`} 
                  className="max-w-full max-h-full object-contain" 
                />
              </div>
            )}
            <div>
              <div className="font-medium">{rate.carrier}</div>
              <div className="text-sm text-gray-600">{rate.service}</div>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-lg font-semibold">${rate.rate.toFixed(2)}</div>
            {hasDiscount && (
              <div className="flex items-center gap-1">
                <span className="text-xs line-through text-gray-500">${originalRate?.toFixed(2)}</span>
                <Badge variant="success" className="text-xs py-0 px-1">-{discount}%</Badge>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-3 text-sm">
          <div className="text-gray-600 flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" />
            {deliveryEstimate}
          </div>
          
          {isSelected && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500 text-white">
              <CheckCircle className="h-3.5 w-3.5" />
              Selected
            </Badge>
          )}
        </div>
        
        {(isBestValue || isFastest || isRecommended) && (
          <div className="mt-3 flex gap-2">
            {isBestValue && (
              <Badge className="bg-green-500 text-xs flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Best Value
              </Badge>
            )}
            {isFastest && (
              <Badge className="bg-blue-500 text-xs flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Fastest
              </Badge>
            )}
            {isRecommended && (
              <Badge className="bg-purple-500 text-xs flex items-center gap-1">
                <Award className="h-3 w-3" />
                AI Pick
              </Badge>
            )}
          </div>
        )}
        
        {isRecommended && aiRecommendation?.reason && (
          <div className="mt-2 text-sm text-purple-700 bg-purple-50 p-2 rounded-md">
            {aiRecommendation.reason}
          </div>
        )}
      </div>
    </Card>
  );
};

// Helper function to get carrier logos
const getCarrierLogo = (carrier: string): string | null => {
  const logos: Record<string, string> = {
    'usps': '/carriers/usps.png',
    'fedex': '/carriers/fedex.png',
    'ups': '/carriers/ups.png',
    'dhl': '/carriers/dhl.png'
  };
  
  // Try to find an exact match
  if (logos[carrier]) {
    return logos[carrier];
  }
  
  // If not found, try to find a partial match
  const carrierKey = Object.keys(logos).find(key => carrier.includes(key));
  return carrierKey ? logos[carrierKey] : null;
};

export default ShippingRateCard;

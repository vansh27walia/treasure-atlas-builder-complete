
import React from 'react';
import { Check, Zap, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCarrierLogoUrl } from '@/utils/addressUtils';

interface ShippingRateCardProps {
  rate: {
    id: string;
    carrier: string;
    service: string;
    rate: string;
    currency: string;
    delivery_days?: number;
    delivery_date?: string | null;
    list_rate?: string;
    retail_rate?: string;
    est_delivery_days?: number;
    isPremium?: boolean;
    original_rate?: string;
  };
  isSelected: boolean;
  onSelect: (rateId: string) => void;
  onLabelCreate?: () => void;
  isBestValue: boolean;
  isFastest: boolean;
  aiRecommendation?: {
    rateId: string;
    reason: string;
  };
  showDiscount?: boolean;
  originalRate?: string;
  isPremium?: boolean;
  showCreateButton?: boolean;
  shippingDetails?: any;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  onLabelCreate,
  isBestValue,
  isFastest,
  aiRecommendation,
  showDiscount = false,
  isPremium = false,
  showCreateButton = false,
  shippingDetails,
}) => {
  const isRecommended = aiRecommendation && aiRecommendation.rateId === rate.id;
  const deliveryDays = rate.delivery_days || rate.est_delivery_days;
  const deliveryEstimate = deliveryDays === 1 ? 'Next day' : deliveryDays ? `${deliveryDays} days` : 'N/A';
  
  // Calculate discount percentage if available
  const originalRate = rate.original_rate || rate.list_rate || rate.retail_rate;
  const hasDiscount = showDiscount && originalRate && Number(originalRate) > Number(rate.rate);
  const discountPercent = hasDiscount ? 
    Math.round((1 - (Number(rate.rate) / Number(originalRate))) * 100) : 0;
  
  // Get carrier logo with fallback
  const carrierLogo = getCarrierLogoUrl(rate.carrier);
  
  // Fallback for carrier display name
  const getCarrierDisplayName = (carrier: string): string => {
    return carrier.toUpperCase();
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLabelCreate) {
      onLabelCreate();
    }
  };
  
  return (
    <div
      className={`
        border rounded-lg p-4 cursor-pointer transition-all
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
        ${isPremium ? 'border-amber-400 bg-amber-50/50' : ''}
      `}
      onClick={() => onSelect(rate.id)}
      data-testid={`rate-card-${rate.id}`}
      data-rate-id={rate.id}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {carrierLogo ? (
            <div className="h-10 w-16 flex items-center justify-center bg-white p-1 rounded">
              <img 
                src={carrierLogo} 
                alt={`${rate.carrier} logo`} 
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  // If image fails to load, hide the image container
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="h-10 w-16 flex items-center justify-center bg-gray-100 rounded">
              <span className="text-xs font-bold text-gray-700">{getCarrierDisplayName(rate.carrier)}</span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-gray-900 mb-1">{getCarrierDisplayName(rate.carrier)}</h3>
            <p className="text-sm text-gray-600">{rate.service}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          {isSelected && (
            <div className="bg-blue-500 rounded-full p-1 mr-2">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ${parseFloat(originalRate).toFixed(2)}
                </span>
              )}
              <span className="font-bold text-lg">
                ${parseFloat(rate.rate).toFixed(2)}
              </span>
            </div>
            {hasDiscount && (
              <span className="text-xs font-medium text-green-600">
                Save {discountPercent}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-2">
          {isBestValue && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <TrendingDown className="h-3 w-3 mr-1" /> Best Value
            </Badge>
          )}
          
          {isFastest && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
              <Zap className="h-3 w-3 mr-1" /> Fastest
            </Badge>
          )}
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600">
            Est. Delivery: <span className="font-medium">{deliveryEstimate}</span>
          </span>
        </div>
      </div>
      
      {isRecommended && (
        <div className="mt-2 text-sm text-gray-600 border-t border-gray-200 pt-2">
          <span className="font-medium text-blue-600">AI Recommended:</span> {aiRecommendation.reason}
        </div>
      )}

      {isSelected && showCreateButton && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <Button 
            onClick={handleCreateClick}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Create Label - ${parseFloat(rate.rate).toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShippingRateCard;

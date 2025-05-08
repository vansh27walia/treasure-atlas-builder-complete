
import React from 'react';
import { CheckCircle, Clock, DollarSign, Info, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShippingRateCardProps {
  rate: {
    id: string;
    carrier: string;
    service: string;
    rate: string;
    currency: string;
    delivery_days?: number;
    delivery_date?: string;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  aiRecommendation?: {
    rateId: string;
    reason: string;
  };
  showDiscount?: boolean;
  originalRate?: string;
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
  isPremium = false
}) => {
  const isRecommended = aiRecommendation && aiRecommendation.rateId === rate.id;
  
  // Calculate discount percentage if original rate is provided
  const discountPercentage = originalRate && rate.rate ? 
    Math.round(((parseFloat(originalRate) - parseFloat(rate.rate)) / parseFloat(originalRate)) * 100) : 0;
  
  // Format delivery estimate
  const formatDeliveryEstimate = () => {
    if (rate.delivery_days === 1) {
      return '1 day';
    } else if (rate.delivery_days) {
      return `${rate.delivery_days} days`;
    }
    return 'Estimated delivery time unavailable';
  };
  
  return (
    <div 
      className={`rounded-lg border-2 transition-all duration-300 relative overflow-hidden
        ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-100' : 
          isPremium ? 'border-amber-300' : 'border-gray-200'}
        ${isPremium ? 'bg-gradient-to-r from-amber-50 to-yellow-50' : 
          isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
      onClick={() => onSelect(rate.id)}
      data-rate-id={rate.id}
    >
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute -top-1 -right-8 transform rotate-45 bg-amber-400 text-white px-10 py-1 shadow-md">
          <span className="text-xs font-bold flex items-center">
            <Sparkles className="h-3 w-3 mr-1" /> Premium
          </span>
        </div>
      )}
      
      <div className="p-4 cursor-pointer">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-semibold text-lg mb-1">{rate.carrier.toUpperCase()}</span>
            <span className="text-gray-600 text-sm">{rate.service}</span>
            
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm">{formatDeliveryEstimate()}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            {showDiscount && originalRate && (
              <div className="flex items-center mb-1">
                <span className="text-gray-500 text-sm line-through mr-2">${originalRate}</span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                  Save {discountPercentage}%
                </span>
              </div>
            )}
            
            <div className="flex items-center">
              <span className="font-bold text-2xl text-blue-800">${rate.rate}</span>
              <span className="text-xs text-gray-500 ml-1">{rate.currency}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {isBestValue && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded flex items-center">
              <DollarSign className="h-3 w-3 mr-1" /> Best Value
            </span>
          )}
          
          {isFastest && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Fastest
            </span>
          )}
          
          {isRecommended && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded flex items-center cursor-help">
                    <Info className="h-3 w-3 mr-1" /> AI Recommended
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-64 p-3 text-sm">
                  <p>{aiRecommendation?.reason || "Recommended based on your shipping needs"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isPremium && (
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded flex items-center">
              <Sparkles className="h-3 w-3 mr-1" /> Premium Service
            </span>
          )}
        </div>
      </div>
      
      {isSelected && (
        <div className="bg-blue-500 py-1 px-3 flex justify-center items-center">
          <CheckCircle className="h-4 w-4 text-white mr-2" />
          <span className="text-white text-sm font-medium">Selected</span>
        </div>
      )}
    </div>
  );
};

export default ShippingRateCard;

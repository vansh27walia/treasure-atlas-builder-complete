
import React from 'react';
import { Check, Clock, CreditCard, ShoppingCart, Award, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingRateCardProps {
  rate: {
    id: string;
    carrier: string;
    service: string;
    rate: number;
    delivery_days?: number;
    logo_url?: string;
    original_rate?: number;
    currency: string;
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
  originalRate?: number;
  isPremium?: boolean;
}

const carrierLogos: Record<string, string> = {
  'usps': 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20200805/dcb27bfdcc124573869eaaf6bc2795f506.png',
  'fedex': 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20200805/fbe5d7d72d8e4849a4cc64c6984507872.png',
  'ups': 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20200805/a9f72d1fc8f646c4ad7c5e69a73c1d9175.png',
  'dhl': 'https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20200805/654bffc30eb949278ef0fcbe52a9c9b068.png',
};

// Colors for each carrier
const carrierColors: Record<string, { primary: string, secondary: string }> = {
  'usps': { primary: '#004B87', secondary: '#DA291C' },
  'fedex': { primary: '#4D148C', secondary: '#FF6600' },
  'ups': { primary: '#351C15', secondary: '#FFB500' },
  'dhl': { primary: '#FFCC00', secondary: '#D40511' },
};

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
  const isAiRecommended = aiRecommendation?.rateId === rate.id;
  
  // Determine carrier logo
  const carrierKey = rate.carrier.toLowerCase();
  const logoUrl = rate.logo_url || carrierLogos[carrierKey] || '';
  
  // Get carrier colors
  const colors = carrierColors[carrierKey] || { primary: '#333', secondary: '#666' };
  
  // Calculate discount if original rate is provided
  const displayOriginalRate = originalRate || rate.original_rate;
  const hasDiscount = showDiscount && displayOriginalRate && displayOriginalRate > rate.rate;
  const discountPercent = hasDiscount 
    ? Math.round(((displayOriginalRate - rate.rate) / displayOriginalRate) * 100) 
    : 0;

  return (
    <div 
      className={cn(
        "border rounded-lg transition-all overflow-hidden",
        isSelected 
          ? "border-blue-500 bg-blue-50 shadow-md" 
          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30",
        isPremium && "border-amber-400",
      )}
    >
      {/* Badges */}
      <div className="relative">
        {(isBestValue || isFastest || isAiRecommended) && (
          <div className="absolute top-0 left-0 right-0 flex space-x-2 p-2 justify-end">
            {isBestValue && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                <Award className="h-3 w-3 mr-1" />
                Best Value
              </span>
            )}
            
            {isFastest && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                <Zap className="h-3 w-3 mr-1" />
                Fastest
              </span>
            )}
            
            {isAiRecommended && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                <Award className="h-3 w-3 mr-1" />
                AI Pick
              </span>
            )}
          </div>
        )}
        
        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-0 left-0 p-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
            >
              Save {discountPercent}%
            </span>
          </div>
        )}
      </div>
      
      {/* Rate Card Content */}
      <div className="p-4">
        {/* Carrier Logo and Name */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={rate.carrier} 
                className="h-8 w-auto object-contain mr-3"
              />
            ) : (
              <div 
                className="h-8 w-12 flex items-center justify-center rounded bg-gray-100 mr-3"
                style={{ backgroundColor: colors.primary, color: 'white' }}
              >
                <span className="text-xs font-bold">{rate.carrier.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h3 className="font-medium">{rate.carrier.toUpperCase()}</h3>
              <p className="text-sm text-gray-600">{rate.service}</p>
            </div>
          </div>
          
          <div 
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center",
              isSelected 
                ? "bg-blue-600 border-blue-600" 
                : "bg-white border-gray-300"
            )}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
        
        {/* Price and Delivery Time */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {rate.delivery_days 
                ? rate.delivery_days === 1 
                  ? "1 day delivery"
                  : `${rate.delivery_days} days delivery`
                : "Delivery time varies"
              }
            </p>
          </div>
          <div className="text-right">
            {hasDiscount && (
              <p className="text-sm text-gray-500 line-through">
                ${displayOriginalRate?.toFixed(2)}
              </p>
            )}
            <p className="text-lg font-bold text-blue-700">
              ${rate.rate.toFixed(2)} <span className="text-xs font-normal text-gray-500">{rate.currency}</span>
            </p>
          </div>
        </div>
        
        {isPremium && (
          <div className="mt-3 bg-amber-50 p-2 rounded-md border border-amber-200">
            <p className="text-xs text-amber-800 flex items-center">
              <Award className="h-3 w-3 mr-1 text-amber-600" />
              Premium service with additional insurance
            </p>
          </div>
        )}
        
        {isAiRecommended && aiRecommendation?.reason && (
          <div className="mt-3 bg-blue-50 p-2 rounded-md border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Why recommended:</strong> {aiRecommendation.reason}
            </p>
          </div>
        )}
      </div>
      
      {/* Select Button */}
      <button
        onClick={() => onSelect(rate.id)}
        className={cn(
          "w-full p-2 text-sm font-medium rounded-t-none transition-colors",
          isSelected 
            ? "bg-blue-600 text-white hover:bg-blue-700" 
            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        )}
      >
        {isSelected ? "Selected" : "Select"}
      </button>
    </div>
  );
};

export default ShippingRateCard;

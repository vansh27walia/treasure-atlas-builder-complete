
import React from 'react';
import { Package, Check, Clock, Award, Zap, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

interface AIRecommendation {
  rateId: string;
  reason: string;
}

interface ShippingRateCardProps {
  rate: ShippingRate;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isBestValue?: boolean;
  isFastest?: boolean;
  aiRecommendation?: AIRecommendation;
  showDiscount?: boolean;
  originalRate?: string;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({ 
  rate, 
  isSelected, 
  onSelect,
  isBestValue,
  isFastest,
  aiRecommendation,
  showDiscount = true, // Set default to true to show discounts by default
  originalRate
}) => {
  const isRecommended = aiRecommendation?.rateId === rate.id;
  
  // Format date if available
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      console.error('Error parsing date:', err);
      return dateString;
    }
  };
  
  const getDeliveryDaysText = () => {
    const days = rate.delivery_days || rate.est_delivery_days;
    if (!days) return 'Delivery time unknown';
    if (days === 1) return '1 day delivery';
    return `${days} days delivery`;
  };

  // Calculate or use provided original rate for display
  const getOriginalRate = () => {
    // First check if we have a specific original_rate provided
    if (originalRate) {
      return originalRate;
    }
    
    // Next check if the rate object has an original_rate
    if (rate.original_rate) {
      return rate.original_rate;
    }
    
    // If no original rate, create one by inflating the current rate by 25%
    const currentRate = parseFloat(rate.rate);
    const inflatedRate = (currentRate * 1.25).toFixed(2);
    return inflatedRate;
  };

  const effectiveOriginalRate = getOriginalRate();
  
  // Calculate savings percentage
  const calculateSavingsPercent = () => {
    const original = parseFloat(effectiveOriginalRate);
    const current = parseFloat(rate.rate);
    if (original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  const savingsPercent = calculateSavingsPercent();

  // Get carrier logo based on carrier name - using better URLs for reliable loading
  const getCarrierLogo = (carrier: string) => {
    const carrierLowerCase = carrier.toLowerCase();

    if (carrierLowerCase.includes('ups')) {
      return 'https://www.ups.com/assets/resources/images/UPS_logo.svg';
    } else if (carrierLowerCase.includes('usps')) {
      return 'https://www.usps.com/assets/images/global/usps-logo-2021.svg';
    } else if (carrierLowerCase.includes('fedex')) {
      return 'https://www.fedex.com/content/dam/fedex-com/logos/logo.png';
    } else if (carrierLowerCase.includes('dhl')) {
      return 'https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg';
    } else {
      return null;
    }
  };

  const carrierLogo = getCarrierLogo(rate.carrier);
  
  return (
    <div 
      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-50 border-blue-400 shadow-md' 
          : 'bg-white border-gray-200 hover:border-blue-200 hover:shadow-sm'
      }`}
      data-rate-id={rate.id}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 items-center">
        {/* Carrier Info - 3 cols */}
        <div className="p-4 md:col-span-3 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="flex items-center justify-between md:block">
            <div>
              {carrierLogo ? (
                <div className="h-8 mb-2">
                  <img 
                    src={carrierLogo} 
                    alt={`${rate.carrier} logo`}
                    className="max-h-8 max-w-full object-contain"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const text = document.createElement('span');
                        text.textContent = rate.carrier.toUpperCase();
                        text.className = 'font-semibold text-gray-800';
                        parent.appendChild(text);
                      }
                    }}
                  />
                </div>
              ) : (
                <h3 className="font-semibold text-gray-800">{rate.carrier.toUpperCase()}</h3>
              )}
              <p className="text-sm text-gray-600 mt-1">{rate.service}</p>
              
              {/* Tags section */}
              <div className="flex flex-wrap gap-1 mt-2">
                {isBestValue && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                )}
                
                {isFastest && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Fastest
                  </Badge>
                )}
                
                {isRecommended && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    AI Pick
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="md:mt-3 flex md:block">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Delivery & Details - 6 cols */}
        <div className="p-4 md:col-span-6 border-b md:border-b-0 md:border-r border-gray-200">
          <div className="flex flex-col">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium">{getDeliveryDaysText()}</span>
            </div>
            
            {rate.delivery_date && (
              <p className="text-xs text-gray-600 mt-1 ml-6">
                Est. delivery by {formatDate(rate.delivery_date)}
              </p>
            )}
            
            {savingsPercent > 0 && showDiscount && (
              <div className="mt-3 flex items-center">
                <Badge className="bg-red-100 text-red-600 font-semibold border-none">
                  SAVE {savingsPercent}%
                </Badge>
                <div className="ml-2 flex items-center">
                  <span className="text-sm text-gray-500 line-through">${effectiveOriginalRate}</span>
                  <span className="text-sm font-semibold text-blue-600 ml-1">
                    You save ${(parseFloat(effectiveOriginalRate) - parseFloat(rate.rate)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {isRecommended && aiRecommendation?.reason && (
              <p className="text-xs italic text-blue-600 mt-2">
                "{aiRecommendation.reason}"
              </p>
            )}
          </div>
        </div>
        
        {/* Price & Action - 3 cols */}
        <div className="p-4 md:col-span-3 bg-gray-50">
          <div className="flex items-center justify-between md:flex-col md:items-end">
            <div className="text-right mb-2">
              <div className="text-lg font-bold text-blue-800">${rate.rate}</div>
              {savingsPercent > 0 && showDiscount && (
                <div className="text-xs text-gray-500 line-through">${effectiveOriginalRate}</div>
              )}
            </div>
            
            <Button
              onClick={() => onSelect(rate.id)}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className={isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {isSelected ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Selected
                </>
              ) : (
                'Select'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingRateCard;

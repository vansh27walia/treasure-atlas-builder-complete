
import React, { useState } from 'react';
import { Check, Zap, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCarrierLogoUrl } from '@/utils/addressUtils';
import { toast } from '@/components/ui/sonner';
import PaymentSelectionModal from '@/components/payment/PaymentSelectionModal';

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
  onPaymentSuccess?: () => void;
  isBestValue: boolean;
  isFastest: boolean;
  aiRecommendation?: {
    rateId: string;
    reason: string;
  };
  showDiscount?: boolean;
  originalRate?: string;
  isPremium?: boolean;
  showPayButton?: boolean;
  shippingDetails?: any;
}

const ShippingRateCard: React.FC<ShippingRateCardProps> = ({
  rate,
  isSelected,
  onSelect,
  onPaymentSuccess,
  isBestValue,
  isFastest,
  aiRecommendation,
  showDiscount = false,
  isPremium = false,
  showPayButton = false,
  shippingDetails,
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  
  // Enhanced carrier display with logo
  const getCarrierDisplayName = (carrier: string): string => {
    switch(carrier.toLowerCase()) {
      case 'usps': return 'USPS';
      case 'ups': return 'UPS';
      case 'fedex': return 'FedEx';
      case 'dhl': return 'DHL';
      default: return carrier.toUpperCase();
    }
  };

  // Get carrier logo URL based on carrier name
  const getCarrierLogo = (carrier: string): string => {
    switch(carrier.toLowerCase()) {
      case 'usps': return 'https://logos-world.net/wp-content/uploads/2020/12/USPS-Logo.png';
      case 'ups': return 'https://logos-world.net/wp-content/uploads/2020/09/UPS-Logo.png';
      case 'fedex': return 'https://logos-world.net/wp-content/uploads/2020/09/FedEx-Logo.png';
      case 'dhl': return 'https://logos-world.net/wp-content/uploads/2020/09/DHL-Logo.png';
      default: return '';
    }
  };

  const handlePayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Creating label...');
    
    // Trigger label creation flow
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
    
    // Navigate to label creation/success page
    setTimeout(() => {
      window.location.href = '/create-label?tab=domestic';
    }, 1500);
  };
  
  return (
    <div>
      <PaymentSelectionModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        amount={parseFloat(rate.rate)}
        description={`${getCarrierDisplayName(rate.carrier)} ${rate.service} shipping`}
        shippingDetails={shippingDetails}
      />
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
            {/* Enhanced carrier logo display */}
            <div className="h-12 w-20 flex items-center justify-center bg-white p-1 rounded border">
              {getCarrierLogo(rate.carrier) ? (
                <img 
                  src={getCarrierLogo(rate.carrier)} 
                  alt={`${rate.carrier} logo`} 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text if image fails
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-xs font-bold text-gray-700 ${getCarrierLogo(rate.carrier) ? 'hidden' : ''}`}>
                {getCarrierDisplayName(rate.carrier)}
              </span>
            </div>
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

            {deliveryDays === 2 && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                2-Day
              </Badge>
            )}

            {deliveryDays === 3 && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                3-Day
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

        {isSelected && showPayButton && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button 
              onClick={handlePayClick}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Pay ${parseFloat(rate.rate).toFixed(2)} & Create Label
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingRateCard;

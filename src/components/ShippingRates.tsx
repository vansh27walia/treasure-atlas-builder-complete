
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, DollarSign, Package, Shield, Star, TrendingDown, Zap } from 'lucide-react';
import { useShippingRates, ShippingRate } from '@/hooks/useShippingRates';
import CarrierLogo from './shipping/CarrierLogo';

interface ShippingRatesProps {
  rates: ShippingRate[];
  onRateSelected: (rate: ShippingRate | string) => void;
  loading?: boolean;
  selectedRateId?: string;
  showEnhancedUI?: boolean;
}

const ShippingRates: React.FC<ShippingRatesProps> = ({ 
  rates, 
  onRateSelected, 
  loading = false, 
  selectedRateId,
  showEnhancedUI = false 
}) => {
  const {
    handleCreateLabel,
    handleProceedToPayment,
    isLoading,
    isProcessingPayment
  } = useShippingRates();

  const [localSelectedId, setLocalSelectedId] = useState<string | null>(selectedRateId || null);

  useEffect(() => {
    setLocalSelectedId(selectedRateId || null);
  }, [selectedRateId]);

  const handleRateClick = (rate: ShippingRate) => {
    setLocalSelectedId(rate.id);
    onRateSelected(rate);
  };

  const handleCreateLabelClick = async (rate: ShippingRate) => {
    try {
      await handleCreateLabel(rate.id, rate.shipment_id);
    } catch (error) {
      console.error('Error creating label:', error);
    }
  };

  const getRateBadges = (rate: ShippingRate) => {
    const badges = [];
    
    // Check if it's the cheapest
    const cheapest = Math.min(...rates.map(r => parseFloat(r.rate)));
    if (parseFloat(rate.rate) === cheapest) {
      badges.push({ label: 'CHEAPEST', color: 'bg-green-500 text-white', icon: '💰' });
    }
    
    // Check if it's the fastest
    const fastest = Math.min(...rates.map(r => r.delivery_days));
    if (rate.delivery_days === fastest) {
      badges.push({ label: 'FASTEST', color: 'bg-blue-500 text-white', icon: '⚡' });
    }
    
    // Premium service badge
    if (rate.isPremium) {
      badges.push({ label: 'PREMIUM', color: 'bg-purple-500 text-white', icon: '⭐' });
    }
    
    // Discount badge
    if (rate.discount_percentage && rate.discount_percentage > 0) {
      badges.push({ 
        label: `${rate.discount_percentage}% OFF`, 
        color: 'bg-orange-500 text-white', 
        icon: '🔥' 
      });
    }
    
    return badges;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading shipping rates...</span>
        </div>
      </div>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No shipping rates available</h3>
        <p className="text-gray-500">Please fill out the shipping form to get rates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200">
      <div className="border-b-2 border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Shipping Rates</h2>
        <p className="text-gray-600">Choose the best shipping option for your package</p>
        <div className="mt-3 flex gap-2 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <TrendingDown className="w-4 h-4" />
            Best prices guaranteed
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <Shield className="w-4 h-4" />
            Secure shipping
          </span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {rates.map((rate) => {
          const isSelected = localSelectedId === rate.id;
          const badges = getRateBadges(rate);
          
          return (
            <Card 
              key={rate.id}
              data-rate-id={rate.id}
              className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleRateClick(rate)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Carrier Logo */}
                    <div className="flex-shrink-0">
                      <CarrierLogo carrier={rate.carrier} className="w-12 h-12" />
                    </div>
                    
                    {/* Rate Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {rate.carrier}
                        </h3>
                        {badges.slice(0, 2).map((badge, index) => (
                          <Badge key={index} className={`${badge.color} text-xs px-2 py-1`}>
                            {badge.icon} {badge.label}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{rate.service}</p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{rate.delivery_days} business days</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-600">
                          <Package className="w-4 h-4" />
                          <span>Delivery by {new Date(rate.delivery_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Section */}
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        {rate.original_rate && parseFloat(rate.original_rate) > parseFloat(rate.rate) ? (
                          <div>
                            <span className="text-2xl font-bold text-green-600">
                              ${parseFloat(rate.rate).toFixed(2)}
                            </span>
                            <div className="text-sm text-gray-500 line-through">
                              ${parseFloat(rate.original_rate).toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xl font-bold text-gray-900">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="space-y-2 mt-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateLabelClick(rate);
                          }}
                          disabled={isLoading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white border-2 border-green-600"
                        >
                          {isLoading ? 'Creating...' : 'Create Label'}
                        </Button>
                        
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProceedToPayment();
                          }}
                          disabled={isProcessingPayment}
                          variant="outline"
                          className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          {isProcessingPayment ? 'Processing...' : 'Proceed to Payment'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional badges row */}
                {badges.length > 2 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {badges.slice(2).map((badge, index) => (
                      <Badge key={index} className={`${badge.color} text-xs px-2 py-1`}>
                        {badge.icon} {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <Star className="w-4 h-4 fill-current" />
                    Selected Rate
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingRates;

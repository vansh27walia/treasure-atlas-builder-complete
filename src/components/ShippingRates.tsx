
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Package, Star, CheckCircle2 } from 'lucide-react';
import { useShippingRates } from '@/hooks/useShippingRates';
import EnhancedCarrierLogo from '@/components/shipping/EnhancedCarrierLogo';
import InlinePaymentSection from '@/components/shipping/InlinePaymentSection';

interface ShippingRatesProps {
  rates: any[];
  onRateSelected: (rate: any) => void;
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
  const { handleProceedToPayment } = useShippingRates();
  const [selectedRate, setSelectedRate] = useState<any>(null);

  const handleRateClick = (rate: any) => {
    setSelectedRate(rate);
    onRateSelected(rate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading rates...</span>
      </div>
    );
  }

  if (!rates || rates.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No shipping rates available</p>
          <p className="text-gray-500 text-sm mt-2">Please check your shipping details and try again</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Available Shipping Rates ({rates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {rates.map((rate) => (
              <div
                key={rate.id}
                data-rate-id={rate.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedRateId === rate.id || selectedRate?.id === rate.id
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleRateClick(rate)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <EnhancedCarrierLogo 
                      carrier={rate.carrier} 
                      size="lg"
                      className="flex-shrink-0"
                    />
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {rate.carrier} {rate.service}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {rate.delivery_days} business days
                        </div>
                        {rate.delivery_date && (
                          <div className="text-sm text-gray-600">
                            Delivery by {new Date(rate.delivery_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </span>
                      {rate.discount_percentage && rate.discount_percentage > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {rate.discount_percentage}% OFF
                        </Badge>
                      )}
                    </div>
                    
                    {rate.original_rate && parseFloat(rate.original_rate) > parseFloat(rate.rate) && (
                      <div className="text-sm text-gray-500 line-through">
                        ${parseFloat(rate.original_rate).toFixed(2)}
                      </div>
                    )}
                    
                    {rate.isPremium && (
                      <Badge variant="outline" className="mt-1">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                {(selectedRateId === rate.id || selectedRate?.id === rate.id) && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Selected for shipping</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      {selectedRate && (
        <InlinePaymentSection
          selectedRate={selectedRate}
          onProceedToPayment={handleProceedToPayment}
        />
      )}
    </div>
  );
};

export default ShippingRates;

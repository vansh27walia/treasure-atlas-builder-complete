
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, DollarSign, Shield, Star } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import StripePaymentModal from './shipping/StripePaymentModal';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date?: string;
  insurance_cost?: number;
  total_cost?: number;
}

const ShippingRates: React.FC = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternational, setIsInternational] = useState(false);

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Received rates:', event.detail);
      const { rates: newRates, shipmentId: newShipmentId, isInternational: international } = event.detail;
      
      if (newRates && Array.isArray(newRates)) {
        setRates(newRates);
        setShipmentId(newShipmentId);
        setIsInternational(international || false);
      } else {
        console.warn('Invalid rates data received:', event.detail);
        setRates([]);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived);
    return () => document.removeEventListener('easypost-rates-received', handleRatesReceived);
  }, []);

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setShowPaymentModal(true);
    console.log('Selected rate for', isInternational ? 'international' : 'domestic', 'shipping:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful for', isInternational ? 'international' : 'domestic', 'shipment');
    setShowPaymentModal(false);
    
    // Dispatch label creation event with the appropriate endpoint based on shipping type
    document.dispatchEvent(new CustomEvent('label-created', {
      detail: {
        labelData: {
          labelUrl: 'https://example.com/label.pdf',
          trackingCode: 'TEST123456789',
          shipmentId: shipmentId,
          carrier: selectedRate?.carrier,
          service: selectedRate?.service,
          cost: selectedRate?.total_cost || parseFloat(selectedRate?.rate || '0'),
          estimatedDelivery: selectedRate?.delivery_date,
          isInternational: isInternational
        }
      }
    }));
    
    toast.success(`${isInternational ? 'International' : 'Domestic'} shipping label created successfully!`);
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'usps': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ups': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'fedex': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'dhl': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceIcon = (service: string) => {
    if (service.toLowerCase().includes('express') || service.toLowerCase().includes('overnight')) {
      return <Star className="w-4 h-4 text-yellow-500" />;
    }
    return <Truck className="w-4 h-4 text-gray-500" />;
  };

  // Calculate hyper-discounted rate (20% off)
  const getHyperDiscountedRate = (rate: number) => {
    return rate * 0.8;
  };

  // Calculate inflated rate (15% markup)
  const getInflatedRate = (rate: number) => {
    return rate * 1.15;
  };

  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Available {isInternational ? 'International' : 'Domestic'} Shipping Options
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose the best shipping option for your {isInternational ? 'international' : 'domestic'} package
          </p>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3 p-6">
              {rates.map((rate, index) => {
                const baseRate = parseFloat(rate.rate);
                const inflatedRate = getInflatedRate(baseRate);
                const hyperDiscountedRate = getHyperDiscountedRate(baseRate);
                const finalCost = rate.total_cost || baseRate;

                return (
                  <div
                    key={rate.id || index}
                    className="group border rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => handleSelectRate(rate)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(rate.service)}
                          <Badge 
                            variant="outline" 
                            className={`${getCarrierColor(rate.carrier)} font-semibold`}
                          >
                            {rate.carrier.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                            {rate.service}
                          </h3>
                          
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {rate.delivery_days} business day{rate.delivery_days !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {rate.delivery_date && (
                              <span>
                                • Delivery by {rate.delivery_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {/* Show pricing tiers */}
                        <div className="space-y-1 mb-2">
                          <div className="text-xs text-gray-500 line-through">
                            Regular: ${inflatedRate.toFixed(2)}
                          </div>
                          <div className="text-sm text-orange-600">
                            Our Price: ${baseRate.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600 font-semibold">
                            Hyper Discount: ${hyperDiscountedRate.toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            ${finalCost.toFixed(2)}
                          </span>
                        </div>
                        
                        {rate.insurance_cost && rate.insurance_cost > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Shield className="w-3 h-3" />
                            <span>
                              +${rate.insurance_cost.toFixed(2)} insurance
                            </span>
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          className="mt-2 bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRate(rate);
                          }}
                        >
                          Ship It
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        rate={selectedRate}
        shipmentId={shipmentId}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default ShippingRates;

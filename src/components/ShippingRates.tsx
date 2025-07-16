
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, DollarSign, Shield, Star, Award, Zap } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useShippingRates } from '@/hooks/useShippingRates';
import StripePaymentModal from './shipping/StripePaymentModal';

const ShippingRates: React.FC = () => {
  const {
    rates,
    isLoading,
    selectedRateId,
    handleSelectRate,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleFilterByCarrier
  } = useShippingRates();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Received rates:', event.detail);
      const { shipmentId: newShipmentId } = event.detail;
      
      if (newShipmentId) {
        setShipmentId(newShipmentId);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived);
    return () => document.removeEventListener('easypost-rates-received', handleRatesReceived);
  }, []);

  const handleSelectRateForPayment = (rate: any) => {
    setSelectedRate(rate);
    handleSelectRate(rate.id);
    setShowPaymentModal(true);
    console.log('Selected rate for payment:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful');
    setShowPaymentModal(false);
    
    // Dispatch label creation event
    document.dispatchEvent(new CustomEvent('label-created', {
      detail: {
        labelData: {
          labelUrl: 'https://example.com/label.pdf',
          trackingCode: 'TEST123456789',
          shipmentId: shipmentId,
          carrier: selectedRate?.carrier,
          service: selectedRate?.service,
          cost: selectedRate?.total_cost || parseFloat(selectedRate?.rate || '0'),
          estimatedDelivery: selectedRate?.delivery_date
        }
      }
    }));
    
    toast.success('Shipping label created successfully!');
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
      return <Zap className="w-4 h-4 text-yellow-500" />;
    }
    return <Truck className="w-4 h-4 text-gray-500" />;
  };

  const getBadgeForRate = (rateId: string) => {
    if (rateId === bestValueRateId) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
          <Award className="w-3 h-3 mr-1" />
          Best Value
        </Badge>
      );
    }
    if (rateId === fastestRateId) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
          <Zap className="w-3 h-3 mr-1" />
          Fastest
        </Badge>
      );
    }
    return null;
  };

  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="w-full" id="shipping-rates-section">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Available Shipping Options
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose the best shipping option for your package
          </p>
          
          {/* Carrier Filter */}
          {uniqueCarriers.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={activeCarrierFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterByCarrier('all')}
              >
                All Carriers
              </Button>
              {uniqueCarriers.map((carrier) => (
                <Button
                  key={carrier}
                  variant={activeCarrierFilter === carrier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleFilterByCarrier(carrier)}
                >
                  {carrier}
                </Button>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3 p-6">
              {rates.map((rate, index) => (
                <div
                  key={rate.id || index}
                  data-rate-id={rate.id}
                  className={`group border rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    selectedRateId === rate.id ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleSelectRateForPayment(rate)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        {getServiceIcon(rate.service)}
                        <Badge 
                          variant="outline" 
                          className={`${getCarrierColor(rate.carrier)} font-semibold`}
                        >
                          {rate.carrier.toUpperCase()}
                        </Badge>
                        {getBadgeForRate(rate.id)}
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
                      <div className="flex flex-col items-end gap-1">
                        {/* Original Rate (Inflated) */}
                        {rate.original_rate && (
                          <div className="text-sm text-gray-500 line-through">
                            ${parseFloat(rate.original_rate).toFixed(2)}
                          </div>
                        )}
                        
                        {/* Discounted Rate */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-xl font-bold text-green-600">
                            ${parseFloat(rate.rate).toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Discount Badge */}
                        {rate.original_rate && (
                          <div className="text-xs text-green-600 font-medium">
                            Save ${(parseFloat(rate.original_rate) - parseFloat(rate.rate)).toFixed(2)}
                          </div>
                        )}
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
                          handleSelectRateForPayment(rate);
                        }}
                      >
                        Select & Pay
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
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

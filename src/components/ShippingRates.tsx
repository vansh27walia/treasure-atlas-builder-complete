
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, DollarSign, Shield, Star } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import StripePaymentModal from './shipping/StripePaymentModal';
import LabelCreationModal from './shipping/LabelCreationModal';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date?: string;
  insurance_cost?: number;
  total_cost?: number;
  original_rate?: string;
  isPremium?: boolean;
}

const ShippingRates: React.FC = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelData, setLabelData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Process rates to add premium flag and original rates for display
  const processRates = (incomingRates: ShippingRate[]) => {
    return incomingRates.map(rate => {
      // Generate a random discount percentage between 85% and 90%
      const discountPercentage = Math.random() * (90 - 85) + 85;
      
      // Calculate inflated original rate (actual rate + discount percentage)
      const actualRate = parseFloat(rate.rate);
      // Calculate what the "original" price would be before our massive discount
      const inflatedRate = (actualRate * (100 / (100 - discountPercentage))).toFixed(2);
      
      // Generate premium flag - typically express, overnight, or most expensive services
      const isPremium = 
        rate.service.toLowerCase().includes('express') || 
        rate.service.toLowerCase().includes('priority') || 
        rate.service.toLowerCase().includes('overnight') ||
        rate.service.toLowerCase().includes('next day') ||
        rate.service.toLowerCase().includes('same day') ||
        (rate.delivery_days === 1) ||
        actualRate > 20; // If rate is above $20, consider it a premium service
      
      return {
        ...rate,
        original_rate: inflatedRate,
        isPremium,
        total_cost: actualRate
      };
    });
  };

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Received rates:', event.detail);
      const { rates: newRates, shipmentId: newShipmentId } = event.detail;
      
      if (newRates && Array.isArray(newRates)) {
        // Process rates to add discount display and premium flags
        const processedRates = processRates(newRates).map(rate => ({
          ...rate,
          shipment_id: newShipmentId
        }));
        
        setRates(processedRates);
        setShipmentId(newShipmentId);
        console.log('Processed rates:', processedRates);
      } else {
        console.warn('Invalid rates data received:', event.detail);
        setRates([]);
      }
    };

    // Listen for label creation success
    const handleLabelCreated = (event: any) => {
      console.log('Label created:', event.detail);
      if (event.detail && event.detail.labelData) {
        setLabelData(event.detail.labelData);
        setShowLabelModal(true);
        setShowPaymentModal(false);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived);
    document.addEventListener('label-created', handleLabelCreated);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived);
      document.removeEventListener('label-created', handleLabelCreated);
    };
  }, []);

  const handleSelectRate = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setShowPaymentModal(true);
    console.log('Selected rate:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful, creating label...');
    setShowPaymentModal(false);
    
    // Simulate label creation - in real app this would be handled by payment processing
    setTimeout(() => {
      const mockLabelData = {
        labelUrl: 'https://example.com/label.pdf',
        trackingCode: 'TEST123456789',
        shipmentId: shipmentId,
        carrier: selectedRate?.carrier,
        service: selectedRate?.service,
        cost: selectedRate?.total_cost || parseFloat(selectedRate?.rate || '0'),
        estimatedDelivery: selectedRate?.delivery_date
      };
      
      setLabelData(mockLabelData);
      setShowLabelModal(true);
      
      // Dispatch event for other components
      document.dispatchEvent(new CustomEvent('label-created', {
        detail: { labelData: mockLabelData }
      }));
    }, 1000);
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

  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            Available Shipping Options
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose the best shipping option for your package
          </p>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3 p-6">
              {rates.map((rate, index) => (
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
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {rate.original_rate && (
                            <div className="text-xs text-gray-500 line-through">
                              ${parseFloat(rate.original_rate).toFixed(2)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-xl font-bold text-green-600">
                              ${(rate.total_cost || parseFloat(rate.rate)).toFixed(2)}
                            </span>
                          </div>
                        </div>
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

      {/* Label Creation Modal */}
      <LabelCreationModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        labelData={labelData}
      />
    </div>
  );
};

export default ShippingRates;

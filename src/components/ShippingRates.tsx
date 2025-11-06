import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, Shield, Star, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InlinePaymentSection from './shipping/InlinePaymentSection';
import CarrierLogo from './shipping/CarrierLogo';
import { standardizeCarrierName } from '@/utils/carrierUtils';

interface ShippingRate {
  id: string;
  rate: string;
  original_rate?: string;
  discount_percentage?: number;
  carrier: string;
  service: string;
  delivery_days: number;
  currency: string;
  isPremium?: boolean;
  isAIRecommended?: boolean;
  estimated_delivery_date?: string;
}

interface ShippingRatesProps {
  rates: ShippingRate[];
  onRateSelected: (rate: ShippingRate) => void;
  loading?: boolean;
  selectedRateId?: string;
  shipmentDetails?: any;
  insuranceAmount?: number;
}

const ShippingRatesDisplay: React.FC<ShippingRatesProps> = ({
  rates,
  onRateSelected,
  loading = false,
  selectedRateId,
  shipmentDetails: propShipmentDetails,
  insuranceAmount = 2
}) => {
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [localShipmentDetails, setLocalShipmentDetails] = useState<any>(propShipmentDetails);
  const [showAllRates, setShowAllRates] = useState(false);
  const [displayRates, setDisplayRates] = useState<ShippingRate[]>(rates);
  const [dynamicInsuranceCost, setDynamicInsuranceCost] = useState(0);

  // Listen for rate reordering events from the AI panel
  useEffect(() => {
    const handleRatesReordered = (event: any) => {
      if (event.detail?.rates) {
        setDisplayRates(event.detail.rates);
        if (event.detail.rates.length > 0) {
          setSelectedRate(event.detail.rates[0]);
        }
      }
    };
    
    document.addEventListener('rates-reordered', handleRatesReordered);
    return () => document.removeEventListener('rates-reordered', handleRatesReordered);
  }, []);

  // Listen for insurance cost updates
  useEffect(() => {
    const handleInsuranceUpdate = (event: CustomEvent) => {
      const { enabled, cost } = event.detail;
      setDynamicInsuranceCost(enabled ? cost : 0);
    };

    document.addEventListener('insurance-cost-updated', handleInsuranceUpdate as EventListener);
    return () => {
      document.removeEventListener('insurance-cost-updated', handleInsuranceUpdate as EventListener);
    };
  }, []);

  // Listen for rate selection from AI panel
  useEffect(() => {
    const handleRateSelect = (event: CustomEvent) => {
      const { rateId } = event.detail;
      const rate = displayRates.find(r => r.id === rateId);
      if (rate) {
        setSelectedRate(rate);
        onRateSelected(rate);
      }
    };

    document.addEventListener('select-shipping-rate', handleRateSelect as EventListener);
    return () => {
      document.removeEventListener('select-shipping-rate', handleRateSelect as EventListener);
    };
  }, [displayRates, onRateSelected]);

  // Update display rates when rates prop changes and standardize carrier names
  useEffect(() => {
    if (rates && rates.length > 0) {
      // Standardize carrier names
      const standardizedRates = rates.map(rate => ({
        ...rate,
        carrier: standardizeCarrierName(rate.carrier)
      }));
      
      setDisplayRates(standardizedRates);
      if (!selectedRate) {
        const uspsRates = standardizedRates.filter(rate => rate.carrier.toLowerCase().includes('usps'));
        const firstRate = uspsRates.length > 0 ? uspsRates[0] : standardizedRates[0];
        setSelectedRate(firstRate);
      }
    }
  }, [rates]);

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Rates received event:', event.detail);
      if (event.detail?.shipment) {
        setLocalShipmentDetails(event.detail.shipment);
      }
    };
    
    document.addEventListener('ratesReceived', handleRatesReceived);
    return () => document.removeEventListener('ratesReceived', handleRatesReceived);
  }, []);

  const calculateEstimatedDelivery = (deliveryDays: number): string => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCarrierColors = (carrier: string) => {
    const carrierUpper = carrier.toUpperCase();
    switch (carrierUpper) {
      case 'UPS':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          accent: 'bg-amber-600',
          selectedBorder: 'border-amber-500'
        };
      case 'FEDEX':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-800',
          accent: 'bg-purple-600',
          selectedBorder: 'border-purple-500'
        };
      case 'DHL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          accent: 'bg-red-600',
          selectedBorder: 'border-red-500'
        };
      case 'USPS':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          accent: 'bg-blue-600',
          selectedBorder: 'border-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          accent: 'bg-gray-600',
          selectedBorder: 'border-gray-500'
        };
    }
  };

  const handleRateSelection = (rate: ShippingRate) => {
    console.log('Rate selected:', rate);
    setSelectedRate(rate);
    onRateSelected(rate);
    
    // Auto-open AI sidebar when rate is clicked
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('force-show-ai-panel', { 
        detail: { selectedRate: rate } 
      }));
    }, 100);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('Payment successful, creating label...', paymentData);
    setIsCreatingLabel(true);
    
    try {
      window.location.href = `/label-success?labelUrl=${encodeURIComponent(paymentData.labelUrl || '')}&trackingCode=${encodeURIComponent(paymentData.trackingCode || '')}&shipmentId=${encodeURIComponent(paymentData.shipmentId || '')}`;
    } catch (error) {
      console.error('Error after payment:', error);
      toast.error('Payment successful but there was an issue creating the label');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-gray-600">Loading shipping rates...</div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!displayRates || displayRates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rates available</h3>
        <p className="text-gray-600">Please check your shipping details and try again.</p>
      </Card>
    );
  }

  const currentSelectedRate = selectedRate || displayRates[0];
  const otherRates = displayRates.filter(rate => rate.id !== currentSelectedRate?.id);

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Shipping Method</h3>
        
        {/* Selected Rate - Prominent Display */}
        {currentSelectedRate && (
          <Card
            className="relative cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-blue-500 shadow-lg bg-blue-50"
            onClick={() => handleRateSelection(currentSelectedRate)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CarrierLogo carrier={currentSelectedRate.carrier} className="w-12 h-12" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-bold text-lg text-blue-800">
                        {currentSelectedRate.carrier}
                      </h4>
                      <Badge className="bg-blue-600 text-white">SELECTED</Badge>
                      {currentSelectedRate.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {currentSelectedRate.isAIRecommended && (
                        <Badge className="bg-pink-600 text-white text-xs">
                          AI Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-base font-medium text-blue-700 mb-1">
                      {currentSelectedRate.service}
                    </p>
                    <div className="flex items-center text-sm text-blue-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Estimated Delivery: {calculateEstimatedDelivery(currentSelectedRate.delivery_days)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-3">
                    {currentSelectedRate.original_rate && currentSelectedRate.discount_percentage && currentSelectedRate.discount_percentage > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500 line-through">
                          ${parseFloat(currentSelectedRate.original_rate).toFixed(2)}
                        </div>
                        <Badge variant="destructive" className="text-xs mb-1">
                          Save {Math.round(currentSelectedRate.discount_percentage)}%
                        </Badge>
                      </div>
                    )}
                    <div className="text-2xl font-bold text-blue-800">
                      ${parseFloat(currentSelectedRate.rate).toFixed(2)}
                    </div>
                  </div>
                  
                  {currentSelectedRate.delivery_days <= 2 && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Express Delivery
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Other Rates - Collapsible */}
        {otherRates.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setShowAllRates(!showAllRates)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <span>View {otherRates.length} Other Options</span>
              {showAllRates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {showAllRates && (
              <div className="space-y-3 mt-4">
                {otherRates.map((rate) => {
                  const colors = getCarrierColors(rate.carrier);
                  const estimatedDelivery = calculateEstimatedDelivery(rate.delivery_days);
                  
                  return (
                    <Card
                      key={rate.id}
                      className={`relative cursor-pointer transition-all duration-200 hover:shadow-md border ${colors.border} ${colors.bg}`}
                      onClick={() => handleRateSelection(rate)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CarrierLogo carrier={rate.carrier} className="w-8 h-8" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className={`font-semibold ${colors.text}`}>
                                  {rate.carrier}
                                </h4>
                                {rate.isPremium && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {rate.isAIRecommended && (
                                  <Badge className="bg-pink-600 text-white text-xs">
                                    AI
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-600">
                                {rate.service}
                              </p>
                              <div className="flex items-center text-xs mt-1 text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{estimatedDelivery}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {rate.original_rate && rate.discount_percentage && rate.discount_percentage > 0 && (
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 line-through">
                                    ${parseFloat(rate.original_rate).toFixed(2)}
                                  </div>
                                  <Badge variant="destructive" className="text-xs">
                                    Save {Math.round(rate.discount_percentage)}%
                                  </Badge>
                                </div>
                              )}
                              <div className={`text-lg font-bold ${colors.text}`}>
                                ${parseFloat(rate.rate).toFixed(2)}
                              </div>
                            </div>
                            
                            {rate.delivery_days <= 2 && (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                Express
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Continue to Payment Button */}
        {currentSelectedRate && !showPayment && (
          <Button
            onClick={() => setShowPayment(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
          >
            Continue with {currentSelectedRate.carrier} - ${(
              parseFloat(currentSelectedRate.rate) + dynamicInsuranceCost
            ).toFixed(2)}
          </Button>
        )}
      </div>

      {/* Payment Section */}
      {showPayment && currentSelectedRate && (
        <div className="mt-8">
          <InlinePaymentSection
            selectedRate={currentSelectedRate}
            shipmentDetails={localShipmentDetails || propShipmentDetails}
            onPaymentSuccess={handlePaymentSuccess}
            insuranceCost={dynamicInsuranceCost}
            isCreatingLabel={isCreatingLabel}
          />
        </div>
      )}
    </div>
  );
};

export default ShippingRatesDisplay;

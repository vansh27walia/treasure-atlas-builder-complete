import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, Shield, Star, CheckCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InlinePaymentSection from './InlinePaymentSection';
import CarrierLogo from './CarrierLogo';
import UniversalShippingChatbot from './UniversalShippingChatbot';

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

interface ImprovedShippingRatesProps {
  rates: ShippingRate[];
  onRateSelected: (rate: ShippingRate) => void;
  loading?: boolean;
  selectedRateId?: string;
  shipmentDetails?: any;
  insuranceAmount?: number;
}

const ImprovedShippingRates: React.FC<ImprovedShippingRatesProps> = ({
  rates,
  onRateSelected,
  loading = false,
  selectedRateId,
  shipmentDetails: propShipmentDetails,
  insuranceAmount = 0
}) => {
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [localShipmentDetails, setLocalShipmentDetails] = useState<any>(propShipmentDetails);
  const [showAllRates, setShowAllRates] = useState(false);
  const [displayRates, setDisplayRates] = useState<ShippingRate[]>(rates);
  const [showChatbot, setShowChatbot] = useState(true);
  const [dynamicInsuranceCost, setDynamicInsuranceCost] = useState(0);

  // Listen for insurance cost updates from the form
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

  useEffect(() => {
    if (rates && rates.length > 0) {
      setDisplayRates(rates);
      if (!selectedRate) {
        const uspsRates = rates.filter(rate => rate.carrier.toLowerCase().includes('usps'));
        const firstRate = uspsRates.length > 0 ? uspsRates[0] : rates[0];
        setSelectedRate(firstRate);
      }
    }
  }, [rates]);

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
          bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
          border: 'border-amber-200',
          text: 'text-amber-800',
          accent: 'bg-amber-600',
          selectedBorder: 'border-amber-500'
        };
      case 'FEDEX':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
          border: 'border-purple-200',
          text: 'text-purple-800',
          accent: 'bg-purple-600',
          selectedBorder: 'border-purple-500'
        };
      case 'DHL':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-red-100',
          border: 'border-red-200',
          text: 'text-red-800',
          accent: 'bg-red-600',
          selectedBorder: 'border-red-500'
        };
      case 'USPS':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-800',
          accent: 'bg-blue-600',
          selectedBorder: 'border-blue-500'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-800',
          accent: 'bg-gray-600',
          selectedBorder: 'border-gray-500'
        };
    }
  };

  const handleRateSelection = (rate: ShippingRate) => {
    setSelectedRate(rate);
    onRateSelected(rate);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    setIsCreatingLabel(true);
    setShowChatbot(false); // Hide chatbot on payment
    
    try {
      window.location.href = `/label-success?labelUrl=${encodeURIComponent(paymentData.labelUrl || '')}&trackingCode=${encodeURIComponent(paymentData.trackingCode || '')}&shipmentId=${encodeURIComponent(paymentData.shipmentId || '')}`;
    } catch (error) {
      console.error('Error after payment:', error);
      toast.error('Payment successful but there was an issue creating the label');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleCancelOrClose = () => {
    setShowPayment(false);
    setShowChatbot(false); // Hide chatbot on cancel/close
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center text-gray-600">Loading shipping rates...</div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!displayRates || displayRates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Truck className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-gray-900 mb-3">No rates available</h3>
        <p className="text-gray-600">Please check your shipping details and try again.</p>
      </Card>
    );
  }

  const currentSelectedRate = selectedRate || displayRates[0];
  const otherRates = displayRates.filter(rate => rate.id !== currentSelectedRate?.id);

  return (
    <div className="relative space-y-8 pb-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI-Optimized Shipping Options
          </h3>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            4 Criteria Analysis
          </Badge>
        </div>
        
        {/* Selected Rate - Enhanced Display */}
        {currentSelectedRate && (
          <Card className="relative cursor-pointer transition-all duration-300 hover:shadow-xl border-3 border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 via-white to-blue-50">
            <div className="absolute top-4 right-4">
              <Badge className="bg-blue-600 text-white shadow-sm">SELECTED</Badge>
            </div>
            <div className="p-8" onClick={() => handleRateSelection(currentSelectedRate)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <CarrierLogo carrier={currentSelectedRate.carrier} className="w-16 h-16" />
                    {currentSelectedRate.isAIRecommended && (
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="w-6 h-6 text-purple-600 fill-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h4 className="font-bold text-2xl text-blue-800">
                        {currentSelectedRate.carrier}
                      </h4>
                      {currentSelectedRate.isPremium && (
                        <Badge variant="secondary" className="text-sm">
                          <Star className="w-4 h-4 mr-1" />
                          Premium
                        </Badge>
                      )}
                      {currentSelectedRate.isAIRecommended && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          AI Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-blue-700 mb-2">
                      {currentSelectedRate.service}
                    </p>
                    <div className="flex items-center text-blue-600">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-medium">Estimated Delivery: {calculateEstimatedDelivery(currentSelectedRate.delivery_days)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    {currentSelectedRate.original_rate && currentSelectedRate.discount_percentage && currentSelectedRate.discount_percentage > 0 && (
                      <div className="text-right">
                        <div className="text-lg text-gray-500 line-through">
                          ${parseFloat(currentSelectedRate.original_rate).toFixed(2)}
                        </div>
                        <Badge variant="destructive" className="mb-2">
                          Save {Math.round(currentSelectedRate.discount_percentage)}%
                        </Badge>
                      </div>
                    )}
                    <div className="text-3xl font-bold text-blue-800">
                      ${(parseFloat(currentSelectedRate.rate) + dynamicInsuranceCost).toFixed(2)}
                    </div>
                    {dynamicInsuranceCost > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Label: ${parseFloat(currentSelectedRate.rate).toFixed(2)} + Insurance: ${dynamicInsuranceCost.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {currentSelectedRate.delivery_days <= 2 && (
                    <div className="text-sm text-green-600 font-semibold mt-2 bg-green-100 px-3 py-1 rounded-full">
                      Express Delivery
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Other Rates - Enhanced Display */}
        {otherRates.length > 0 && (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowAllRates(!showAllRates)}
              className="w-full flex items-center justify-center space-x-2 h-12 text-lg font-medium border-2 border-gray-200 hover:border-blue-300"
            >
              <span>Compare {otherRates.length} Alternative Options</span>
              {showAllRates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
            
            {showAllRates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {otherRates.map((rate) => {
                  const colors = getCarrierColors(rate.carrier);
                  const estimatedDelivery = calculateEstimatedDelivery(rate.delivery_days);
                  
                  return (
                    <Card
                      key={rate.id}
                      className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg border-2 ${colors.border} ${colors.bg}`}
                      onClick={() => handleRateSelection(rate)}
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <CarrierLogo carrier={rate.carrier} className="w-12 h-12" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`font-bold text-lg ${colors.text}`}>
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
                              <p className="text-sm font-semibold text-gray-700 mb-1">
                                {rate.service}
                              </p>
                              <div className="flex items-center text-xs text-gray-600">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{estimatedDelivery}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2">
                              {rate.original_rate && rate.discount_percentage && rate.discount_percentage > 0 && (
                                <div className="text-right">
                                  <div className="text-sm text-gray-500 line-through">
                                    ${parseFloat(rate.original_rate).toFixed(2)}
                                  </div>
                                  <Badge variant="destructive" className="text-xs">
                                    Save {Math.round(rate.discount_percentage)}%
                                  </Badge>
                                </div>
                              )}
                              <div className={`text-xl font-bold ${colors.text}`}>
                                ${parseFloat(rate.rate).toFixed(2)}
                              </div>
                            </div>
                            
                            {rate.delivery_days <= 2 && (
                              <div className="text-xs text-green-600 font-semibold mt-1 bg-green-100 px-2 py-1 rounded-full">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Continue with {currentSelectedRate.carrier} - ${(parseFloat(currentSelectedRate.rate) + dynamicInsuranceCost).toFixed(2)}
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
            onCancel={handleCancelOrClose}
          />
        </div>
      )}

      {/* Universal Chatbot */}
      {showChatbot && (
        <UniversalShippingChatbot 
          mode="normal" 
          onClose={handleCancelOrClose}
        />
      )}
    </div>
  );
};

export default ImprovedShippingRates;

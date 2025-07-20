import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, Shield, Star, CheckCircle, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import InlinePaymentSection from './shipping/InlinePaymentSection';
import CarrierLogo from './shipping/CarrierLogo';
import AIRateAnalysisPanel from './shipping/AIRateAnalysisPanel';
import RateFilterBar from './shipping/RateFilterBar';

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
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showAllRates, setShowAllRates] = useState(false);
  const [filteredRates, setFilteredRates] = useState<ShippingRate[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('fastest');

  // Initialize with fastest rate as default
  useEffect(() => {
    if (rates.length > 0) {
      const processedRates = rates.map(rate => ({
        ...rate,
        discount_percentage: rate.discount_percentage || Math.floor(Math.random() * 25) + 10, // Mock discount for demo
        original_rate: rate.original_rate || (parseFloat(rate.rate) * 1.3).toFixed(2) // Mock original rate
      }));
      
      handleFilterChange('fastest', processedRates);
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

  const handleFilterChange = (filter: string, ratesToFilter = filteredRates.length > 0 ? filteredRates : rates) => {
    let sortedRates = [...ratesToFilter];
    
    switch (filter) {
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        sortedRates.sort((a, b) => a.delivery_days - b.delivery_days);
        break;
      case 'reliable':
        sortedRates.sort((a, b) => {
          const reliabilityScore = (carrier: string) => {
            if (carrier.toLowerCase().includes('ups')) return 1;
            if (carrier.toLowerCase().includes('usps')) return 2;
            if (carrier.toLowerCase().includes('fedex')) return 3;
            return 4;
          };
          return reliabilityScore(a.carrier) - reliabilityScore(b.carrier);
        });
        break;
      default:
        // Keep original order for other filters
        break;
    }
    
    setFilteredRates(sortedRates);
    setSelectedFilter(filter);
    
    if (sortedRates.length > 0) {
      setSelectedRate(sortedRates[0]);
      onRateSelected(sortedRates[0]);
    }
    
    toast.success(`Rates filtered by ${filter}`);
  };

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
    setSelectedRate(rate);
    onRateSelected(rate);
    setShowAIPanel(true);
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

  if (!rates || rates.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No rates available</h3>
        <p className="text-gray-600">Please check your shipping details and try again.</p>
      </Card>
    );
  }

  const displayRates = filteredRates.length > 0 ? filteredRates : rates;
  const currentSelectedRate = selectedRate || displayRates[0];
  const otherRates = displayRates.filter(rate => rate.id !== currentSelectedRate?.id);

  return (
    <div className="space-y-6">
      {/* Rate Filter Bar */}
      <RateFilterBar 
        onFilterChange={(filter) => handleFilterChange(filter)}
        selectedFilter={selectedFilter}
      />

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Select Shipping Method</h3>
        
        {/* Selected Rate - Enhanced Display */}
        {currentSelectedRate && (
          <Card
            className="relative cursor-pointer transition-all duration-200 hover:shadow-xl border-2 border-blue-500 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50"
            onClick={() => handleRateSelection(currentSelectedRate)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CarrierLogo carrier={currentSelectedRate.carrier} className="w-16 h-16" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-xl text-blue-900">
                        {currentSelectedRate.carrier}
                      </h4>
                      <Badge className="bg-blue-600 text-white px-3 py-1">SELECTED</Badge>
                      {currentSelectedRate.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-lg font-semibold text-blue-800 mb-2">
                      {currentSelectedRate.service}
                    </p>
                    
                    <div className="flex items-center text-sm text-blue-700 mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">Estimated Delivery: {calculateEstimatedDelivery(currentSelectedRate.delivery_days)}</span>
                    </div>
                    
                    {/* AI Rating Labels */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedFilter === 'cheapest' && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">💰 Cheapest Option</Badge>
                      )}
                      {selectedFilter === 'fastest' && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">⚡ Fastest Option</Badge>
                      )}
                      {selectedFilter === 'reliable' && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300">🛡️ Most Reliable</Badge>
                      )}
                      <Badge className="bg-orange-100 text-orange-800 border-orange-300">🧠 AI Recommended</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    {/* Enhanced Discount Display */}
                    {currentSelectedRate.original_rate && currentSelectedRate.discount_percentage && currentSelectedRate.discount_percentage > 0 && (
                      <div className="text-right bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="text-sm text-gray-600 line-through mb-1">
                          Original: ${parseFloat(currentSelectedRate.original_rate).toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-red-600" />
                          <Badge className="bg-red-600 text-white px-2 py-1">
                            SAVE {Math.round(currentSelectedRate.discount_percentage)}%
                          </Badge>
                        </div>
                        <div className="text-xs text-red-700 font-medium mt-1">
                          You save ${(parseFloat(currentSelectedRate.original_rate) - parseFloat(currentSelectedRate.rate)).toFixed(2)}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-900">
                        ${parseFloat(currentSelectedRate.rate).toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {currentSelectedRate.currency}
                      </div>
                    </div>
                  </div>
                  
                  {currentSelectedRate.delivery_days <= 2 && (
                    <div className="text-xs text-green-600 font-bold mt-2 bg-green-100 px-2 py-1 rounded">
                      ⚡ EXPRESS DELIVERY
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Other Rates - Improved Dropdown */}
        {otherRates.length > 0 && (
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowAllRates(!showAllRates)}
              className="w-full flex items-center justify-center space-x-2 py-3 text-lg font-medium"
            >
              <span>View {otherRates.length} Other Options</span>
              {showAllRates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
            
            {showAllRates && (
              <div className="space-y-3 mt-4">
                {otherRates.map((rate) => {
                  const colors = getCarrierColors(rate.carrier);
                  const estimatedDelivery = calculateEstimatedDelivery(rate.delivery_days);
                  
                  return (
                    <Card
                      key={rate.id}
                      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${colors.border} ${colors.bg}`}
                      onClick={() => handleRateSelection(rate)}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
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
                              </div>
                              <p className="text-base font-semibold text-gray-700 mb-1">
                                {rate.service}
                              </p>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{estimatedDelivery}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-3">
                              {/* Enhanced Discount Display for Other Rates */}
                              {rate.original_rate && rate.discount_percentage && rate.discount_percentage > 0 && (
                                <div className="text-right bg-red-50 p-2 rounded border border-red-200">
                                  <div className="text-xs text-gray-500 line-through">
                                    ${parseFloat(rate.original_rate).toFixed(2)}
                                  </div>
                                  <Badge className="bg-red-500 text-white text-xs px-1 py-0.5">
                                    -{Math.round(rate.discount_percentage)}%
                                  </Badge>
                                </div>
                              )}
                              <div className={`text-xl font-bold ${colors.text}`}>
                                ${parseFloat(rate.rate).toFixed(2)}
                              </div>
                            </div>
                            
                            {rate.delivery_days <= 2 && (
                              <div className="text-xs text-green-600 font-bold mt-1 bg-green-100 px-2 py-0.5 rounded">
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

        {/* Enhanced Continue Button */}
        {currentSelectedRate && !showPayment && (
          <Button
            onClick={() => setShowPayment(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 text-xl font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Continue with {currentSelectedRate.carrier} - ${parseFloat(currentSelectedRate.rate).toFixed(2)}
            {currentSelectedRate.discount_percentage && (
              <span className="ml-2 text-yellow-200">
                (Save {Math.round(currentSelectedRate.discount_percentage)}%)
              </span>
            )}
          </Button>
        )}
      </div>

      {/* AI Analysis Panel */}
      <AIRateAnalysisPanel
        selectedRate={currentSelectedRate}
        allRates={displayRates}
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
        onOptimizationChange={(filter) => handleFilterChange(filter)}
      />

      {/* Enhanced Payment Section */}
      {showPayment && currentSelectedRate && (
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-lg">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Your Order</h3>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Selected Service:</span>
                <span className="text-lg font-bold text-blue-600">
                  {currentSelectedRate.carrier} {currentSelectedRate.service}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${parseFloat(currentSelectedRate.rate).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <InlinePaymentSection
            selectedRate={currentSelectedRate}
            shipmentDetails={localShipmentDetails || propShipmentDetails}
            onPaymentSuccess={handlePaymentSuccess}
            insuranceAmount={insuranceAmount}
            isCreatingLabel={isCreatingLabel}
          />
        </div>
      )}
    </div>
  );
};

export default ShippingRatesDisplay;


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, DollarSign, Shield, Star, Filter, Download, Upload, CreditCard, Loader } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from 'react-router-dom';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import CarrierLogo from './shipping/CarrierLogo';
import InlinePaymentSection from './shipping/InlinePaymentSection';
import EnhancedLabelModal from './shipping/EnhancedLabelModal';
import { useShippingRates, type ShippingRate } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';

const ShippingRates: React.FC = () => {
  const navigate = useNavigate();
  const {
    rates,
    allRates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    shipmentId,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier
  } = useShippingRates();

  const { aiRecommendation, isAiLoading, selectRateAndProceed } = useRateCalculator();
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isInternational, setIsInternational] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<any>();
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Insurance amount - $100 coverage for $4
  const INSURANCE_AMOUNT = 4;
  const INSURANCE_COVERAGE = 100;

  useEffect(() => {
    const handleRatesReceived = (event: any) => {
      console.log('Received rates:', event.detail);
      const { rates: newRates, shipmentId: newShipmentId, isInternational: international } = event.detail;
      
      if (newRates && Array.isArray(newRates)) {
        setIsInternational(international || false);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived);
    return () => document.removeEventListener('easypost-rates-received', handleRatesReceived);
  }, []);

  useEffect(() => {
    const handlePaymentCompleted = (event: CustomEvent) => {
      console.log('Payment completed event received:', event.detail);
      if (event.detail.success) {
        setPaymentCompleted(true);
        setIsCreatingLabel(true);
        toast.success('Payment successful! Creating label...');
        
        const labelOptions = {
          label_format: "PDF",
          label_size: selectedLabelFormat
        };
        
        setTimeout(async () => {
          try {
            const labelData = await handleCreateLabel(undefined, undefined, labelOptions);
            setIsCreatingLabel(false);
            
            // Show enhanced label modal
            setShowLabelModal(true);
          } catch (error) {
            console.error('Error creating label after payment:', error);
            setIsCreatingLabel(false);
            toast.error('Label creation failed after payment');
          }
        }, 1000);
      }
    };

    document.addEventListener('payment-completed', handlePaymentCompleted as EventListener);
    
    return () => {
      document.removeEventListener('payment-completed', handlePaymentCompleted as EventListener);
    };
  }, [handleCreateLabel, selectedLabelFormat]);

  const handleSelectRateLocal = (rate: ShippingRate) => {
    setSelectedRate(rate);
    handleSelectRate(rate.id);
    console.log('Selected rate for', isInternational ? 'international' : 'domestic', 'shipping:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful for', isInternational ? 'international' : 'domestic', 'shipment');
    setPaymentCompleted(true);
    setIsCreatingLabel(true);
    
    toast.success(`${isInternational ? 'International' : 'Domestic'} shipping label created successfully!`);
  };

  const getCarrierGradient = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'usps': return 'from-blue-500 to-blue-700';
      case 'ups': return 'from-amber-500 to-orange-600';
      case 'fedex': return 'from-purple-500 to-purple-700';
      case 'dhl': return 'from-yellow-500 to-orange-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const handleLabelFormatChange = async (format: string): Promise<void> => {
    setSelectedLabelFormat(format);
    
    if (selectedRateId && shipmentId && labelUrl) {
      try {
        console.log("Regenerating label with new format:", format);
        await handleCreateLabel(selectedRateId, shipmentId, {
          label_format: "PDF",
          label_size: format
        });
      } catch (error) {
        console.error("Error updating label format:", error);
        toast.error("Failed to update label format");
        throw error;
      }
    }
  };

  const getDiscountPercentage = (rate: ShippingRate): number => {
    const carrierLower = rate.carrier.toLowerCase();
    const serviceLower = rate.service.toLowerCase();
    
    if (carrierLower === 'usps') {
      if (serviceLower.includes('express') || serviceLower.includes('priority') || serviceLower.includes('next day')) {
        return 63; // USPS next day delivery: 63%
      } else if (serviceLower.includes('first class')) {
        return 86; // USPS first class: 86%
      } else {
        return 68; // Normal USPS: 68%
      }
    } else if (carrierLower === 'ups') {
      if (serviceLower.includes('next day') || serviceLower.includes('express')) {
        return 75; // UPS next day delivery: 75%
      } else if (serviceLower.includes('2nd day') || serviceLower.includes('second day')) {
        return 75; // UPS second day: 75%
      } else if (serviceLower.includes('ground')) {
        return 78; // UPS ground: 78%
      } else {
        return 75; // Default UPS: 75%
      }
    } else if (carrierLower === 'fedex') {
      return 70; // FedEx: 70%
    } else if (carrierLower === 'dhl') {
      return 72; // DHL: 72%
    }
    
    return 65; // Default discount
  };

  if (rates.length === 0) {
    return (
      <div className="w-full" id="shipping-rates-section">
        <EmptyRatesState />
        <div className="mt-4 flex justify-end">
          <Link to="/bulk-upload">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedRates = [...rates].sort((a, b) => {
    if (sortOrder === 'price') {
      return parseFloat(a.rate) - parseFloat(b.rate);
    } else if (sortOrder === 'speed') {
      const aDays = a.delivery_days || 999;
      const bDays = b.delivery_days || 999;
      return aDays - bDays;
    } else {
      return a.carrier.localeCompare(b.carrier);
    }
  });

  const fromCalculator = sessionStorage.getItem('calculatorData') !== null;
  const rateAmount = selectedRate ? parseFloat(selectedRate.rate) : 0;
  const insuranceAmount = INSURANCE_AMOUNT;
  const totalAmount = rateAmount + insuranceAmount;
  const showPaymentSection = selectedRateId && !paymentCompleted && !labelUrl && !isCreatingLabel;

  return (
    <div className="w-full pb-6" id="shipping-rates-section">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Available Shipping Options
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier="usps" className="h-6" />
                  <CarrierLogo carrier="ups" className="h-6" />
                  <CarrierLogo carrier="fedex" className="h-6" />
                  <CarrierLogo carrier="dhl" className="h-6" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  ${INSURANCE_COVERAGE} Insurance Included
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 lg:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border border-blue-200 hover:bg-blue-50">
                    <Filter className="h-4 w-4" />
                    {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-blue-200 shadow-lg z-[9999]">
                  <DropdownMenuItem onClick={() => handleFilterByCarrier('all')}>
                    All Carriers
                  </DropdownMenuItem>
                  {uniqueCarriers.map((carrier) => (
                    <DropdownMenuItem 
                      key={carrier} 
                      onClick={() => handleFilterByCarrier(carrier)}
                    >
                      {carrier.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border border-blue-200 hover:bg-blue-50">
                    Sort by: {
                      sortOrder === 'price' ? 'Price' : 
                      sortOrder === 'speed' ? 'Speed' : 
                      'Carrier'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-blue-200 shadow-lg z-[9999]">
                  <DropdownMenuItem onClick={() => setSortOrder('speed')}>
                    Speed (Fastest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('price')}>
                    Price (Lowest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('carrier')}>
                    Carrier (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {isCreatingLabel && (
            <div className="p-6 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Creating Your Shipping Label...</h3>
                  <p className="text-sm text-blue-600">
                    Please wait while we generate your shipping label. This usually takes a few seconds.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {!labelUrl && !isCreatingLabel && (
            <>
              {(aiRecommendation || isAiLoading) && (
                <div className="p-6 border-b">
                  <ShippingAIRecommendation 
                    aiRecommendation={aiRecommendation}
                    isLoading={isAiLoading}
                    onSelectRecommendation={handleSelectRate}
                  />
                </div>
              )}
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {sortedRates.map((rate, index) => {
                    const currentRate = parseFloat(rate.rate);
                    const isSelected = selectedRateId === rate.id;
                    const isBestValue = rate.id === bestValueRateId;
                    const isFastest = rate.id === fastestRateId;
                    const discountPercentage = getDiscountPercentage(rate);
                    const originalRate = currentRate / (1 - discountPercentage / 100);
                    
                    return (
                      <div 
                        key={rate.id}
                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => handleSelectRateLocal(rate)}
                      >
                        {/* Carrier Header */}
                        <div className={`bg-gradient-to-r ${getCarrierGradient(rate.carrier)} p-3 text-white`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CarrierLogo carrier={rate.carrier} className="h-6 bg-white/20 text-white" />
                              {isBestValue && (
                                <Badge className="bg-green-500 text-white text-xs">Best Value</Badge>
                              )}
                              {isFastest && (
                                <Badge className="bg-blue-500 text-white text-xs">Fastest</Badge>
                              )}
                              <Badge className="bg-red-500 text-white text-xs">
                                {discountPercentage}% OFF
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm opacity-90 mt-1">{rate.service}</div>
                        </div>

                        {/* Rate Details */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl font-bold text-green-600">
                                ${currentRate.toFixed(2)}
                              </div>
                              <div className="text-lg text-gray-500 line-through">
                                ${originalRate.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-green-600 mb-3 flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            ${INSURANCE_COVERAGE} insurance coverage included (${INSURANCE_AMOUNT})
                          </div>

                          <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {rate.delivery_days === 1 ? 'Next day' : `${rate.delivery_days || 'N/A'} business days`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-green-500" />
                              <span>Protected</span>
                            </div>
                          </div>

                          <Button 
                            className={`w-full ${
                              isSelected 
                                ? 'bg-blue-600 hover:bg-blue-700' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRateLocal(rate);
                            }}
                          >
                            {isSelected ? 'Selected' : 'Select This Rate'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inline Payment Section */}
              {showPaymentSection && (
                <div className="p-6 border-t bg-gray-50">
                  <InlinePaymentSection
                    rateAmount={rateAmount}
                    insuranceAmount={insuranceAmount}
                    totalAmount={totalAmount}
                    selectedRate={selectedRate}
                    shipmentId={shipmentId}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Label Modal */}
      <EnhancedLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        labelData={{
          labelUrl: labelUrl || '',
          trackingCode: trackingCode || '',
          shipmentId: shipmentId || '',
          carrier: selectedRate?.carrier,
          service: selectedRate?.service,
          cost: rateAmount,
          isInternational,
          fromAddress: shipmentDetails?.fromAddress,
          toAddress: shipmentDetails?.toAddress
        }}
      />
    </div>
  );
};

export default ShippingRates;

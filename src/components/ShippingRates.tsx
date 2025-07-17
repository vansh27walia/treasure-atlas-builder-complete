import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Truck, DollarSign, Shield, Star, Filter, Download, Upload, CreditCard, Loader } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import StripePaymentModal from './shipping/StripePaymentModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from 'react-router-dom';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import PaymentMethodSelector from './payment/PaymentMethodSelector';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import PrintPreview from './shipping/PrintPreview';
import LabelCreationModal from './shipping/LabelCreationModal';
import type { Rate } from '@/types/shipping';

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
  const [selectedRate, setSelectedRate] = useState<Rate | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isInternational, setIsInternational] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<any>();
  const [showLabelModal, setShowLabelModal] = useState(false);

  // Discount percentage - can be adjusted later
  const DISCOUNT_PERCENTAGE = 85; // 85% discount

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
            
            // Show label creation modal instead of navigating
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

  const handleSelectRateLocal = (rate: Rate) => {
    setSelectedRate(rate);
    handleSelectRate(rate.id);
    console.log('Selected rate for', isInternational ? 'international' : 'domestic', 'shipping:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful for', isInternational ? 'international' : 'domestic', 'shipment');
    setShowPaymentModal(false);
    setPaymentCompleted(true);
    setIsCreatingLabel(true);
    
    toast.success(`${isInternational ? 'International' : 'Domestic'} shipping label created successfully!`);
  };

  const getCarrierColor = (carrier: string) => {
    switch (carrier.toLowerCase()) {
      case 'usps': return 'bg-blue-600';
      case 'ups': return 'bg-amber-600';
      case 'fedex': return 'bg-purple-600';
      case 'dhl': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
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

  const getInflatedPrice = (rate: number) => {
    // Calculate inflated price (original rate before discount)
    return rate / ((100 - DISCOUNT_PERCENTAGE) / 100);
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
  const insuranceAmount = 4; // Fixed $4 insurance
  const totalAmount = rateAmount + insuranceAmount;
  const showPaymentSection = selectedRateId && !paymentCompleted && !labelUrl && !isCreatingLabel;

  return (
    <div className="w-full pb-6" id="shipping-rates-section">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Available Shipping Options
            </CardTitle>
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
            <div className="p-6 bg-yellow-50 border-b border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Creating Your Label...</h3>
              <p className="text-sm text-gray-600">
                Please wait while we generate your shipping label. This usually takes a few seconds.
              </p>
              <div className="mt-2">
                <div className="animate-pulse bg-yellow-200 h-2 rounded"></div>
              </div>
            </div>
          )}
          
          {labelUrl && trackingCode && (
            <div className="p-6 border-b">
              <PrintPreview 
                labelUrl={labelUrl} 
                trackingCode={trackingCode} 
                shipmentId={shipmentId}
                shipmentDetails={shipmentDetails}
                onFormatChange={handleLabelFormatChange}
              />
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
                    const inflatedRate = getInflatedPrice(currentRate);
                    const isSelected = selectedRateId === rate.id;
                    const isBestValue = rate.id === bestValueRateId;
                    const isFastest = rate.id === fastestRateId;
                    
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
                              <span className="font-bold text-lg">{rate.carrier.toUpperCase()}</span>
                              {isBestValue && (
                                <Badge className="bg-green-500 text-white text-xs">Best Value</Badge>
                              )}
                              {isFastest && (
                                <Badge className="bg-blue-500 text-white text-xs">Fastest</Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm opacity-90">Save {DISCOUNT_PERCENTAGE}%</div>
                            </div>
                          </div>
                          <div className="text-sm opacity-90 mt-1">{rate.service}</div>
                        </div>

                        {/* Rate Details */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-4xl font-bold text-green-600">
                              ${currentRate.toFixed(2)}
                            </div>
                            <div className="text-right">
                              <div className="text-lg text-gray-500 line-through">
                                ${inflatedRate.toFixed(2)}
                              </div>
                              <div className="text-sm text-green-600 font-semibold">
                                -{DISCOUNT_PERCENTAGE}% OFF
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            Includes $4 insurance
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
                              <span>Package protection included</span>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Fixed Payment Section at Bottom */}
      {showPaymentSection && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-800">Complete Payment</h3>
                <div className="text-sm text-gray-600">
                  Label: ${rateAmount.toFixed(2)} + Insurance: ${insuranceAmount.toFixed(2)} = Total: ${totalAmount.toFixed(2)}
                </div>
              </div>
              <Button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}

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
        labelData={{
          labelUrl,
          trackingCode,
          shipmentId,
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

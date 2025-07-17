
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isInternational, setIsInternational] = useState(false);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<any>();

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
            await handleCreateLabel(undefined, undefined, labelOptions);
            setIsCreatingLabel(false);
            
            // Navigate to full screen label creation page
            navigate(`/label-success?labelUrl=${encodeURIComponent(labelUrl || '')}&trackingCode=${encodeURIComponent(trackingCode || '')}&shipmentId=${encodeURIComponent(shipmentId || '')}`);
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
  }, [handleCreateLabel, selectedLabelFormat, labelUrl, trackingCode, shipmentId, navigate]);

  const handleSelectRateLocal = (rate: ShippingRate) => {
    setSelectedRate(rate);
    handleSelectRate(rate.id);
    console.log('Selected rate for', isInternational ? 'international' : 'domestic', 'shipping:', rate);
  };

  const handlePaymentSuccess = () => {
    console.log('Payment successful for', isInternational ? 'international' : 'domestic', 'shipment');
    setShowPaymentModal(false);
    setPaymentCompleted(true);
    setIsCreatingLabel(true);
    
    // Navigate to full screen label creation page
    setTimeout(() => {
      navigate(`/label-success?labelUrl=${encodeURIComponent(labelUrl || '')}&trackingCode=${encodeURIComponent(trackingCode || '')}&shipmentId=${encodeURIComponent(shipmentId || '')}`);
    }, 1500);
    
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

  const getHyperDiscountedRate = (rate: number) => {
    return rate * 0.8;
  };

  const getInflatedRate = (rate: number) => {
    return rate * 1.15;
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
  const insuranceAmount = selectedRate?.insurance_cost || 0;
  const totalAmount = rateAmount + insuranceAmount;
  const showPaymentSection = selectedRateId && !paymentCompleted && !labelUrl && !isCreatingLabel;

  return (
    <div className="w-full pb-6" id="shipping-rates-section">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Available {isInternational ? 'International' : 'Domestic'} Shipping Options
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
          <p className="text-sm text-gray-600 mt-2">
            Choose the best shipping option for your {isInternational ? 'international' : 'domestic'} package
          </p>
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
                {sortedRates.map((rate, index) => (
                  <div 
                    key={rate.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRateId === rate.id 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                    onClick={() => handleSelectRateLocal(rate)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <Badge className={`w-fit mb-2 ${getCarrierColor(rate.carrier)}`}>
                            {rate.carrier.toUpperCase()}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            {getServiceIcon(rate.service)}
                            <span className="font-medium text-gray-900">{rate.service}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 line-through">
                              ${getInflatedRate(parseFloat(rate.rate)).toFixed(2)}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              Our Price: ${parseFloat(rate.rate).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            You Pay: ${getHyperDiscountedRate(parseFloat(rate.rate)).toFixed(2)}
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            Save {Math.round((1 - getHyperDiscountedRate(parseFloat(rate.rate)) / getInflatedRate(parseFloat(rate.rate))) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {rate.delivery_days === 1 ? 'Next day' : `${rate.delivery_days} days`}
                          </span>
                        </div>
                        
                        {rate.id === bestValueRateId && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            Best Value
                          </Badge>
                        )}
                        
                        {rate.id === fastestRateId && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            Fastest
                          </Badge>
                        )}
                      </div>
                      
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRateLocal(rate);
                        }}
                      >
                        Ship It
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Section - Fixed position at bottom */}
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
              <PaymentMethodSelector
                selectedPaymentMethod={null}
                onPaymentMethodChange={() => {}}
                onPaymentComplete={(success) => {
                  if (success) {
                    handlePaymentSuccess();
                  }
                }}
                amount={totalAmount}
                description="Shipping Label with Insurance"
              />
            </div>
          </div>
        </div>
      )}

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

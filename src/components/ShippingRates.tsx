import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import PaymentMethodSelector from './payment/PaymentMethodSelector';
import CarrierDropdown from './shipping/CarrierDropdown';
import { useShippingRates, ShippingRate } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { toast } from '@/components/ui/sonner';
import { CreditCard, Loader, Download, Upload, Truck, CheckCircle, Package, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import PrintPreview from './shipping/PrintPreview';

const ShippingRates: React.FC = () => {
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
  const [selectedLabelFormat, setSelectedLabelFormat] = useState('4x6');
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [shipmentDetails, setShipmentDetails] = useState<{ 
    fromAddress: string; 
    toAddress: string; 
    weight: string; 
    dimensions?: string; 
    service: string; 
    carrier: string; 
  } | undefined>();

  const [sortedRates, setSortedRates] = useState<ShippingRate[]>([]);

  // Update sorted rates when rates change
  useEffect(() => {
    setSortedRates(rates);
  }, [rates]);

  // Filter rates based on carrier selection
  const filteredRates = React.useMemo(() => {
    if (activeCarrierFilter === 'all') {
      return sortedRates;
    }
    return sortedRates.filter(rate => 
      rate.carrier && rate.carrier.toLowerCase().includes(activeCarrierFilter.toLowerCase())
    );
  }, [sortedRates, activeCarrierFilter]);

  const handleRatesReorder = (reorderedRates: ShippingRate[]) => {
    setSortedRates(reorderedRates);
  };
  
  
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
            
            document.dispatchEvent(new CustomEvent('shipping-step-change', { 
              detail: { step: 'complete' }
            }));
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
  
  useEffect(() => {
    if (selectedRateId && rates.length > 0) {
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      if (selectedRate) {
        setShipmentDetails({
          fromAddress: "Your shipping address",
          toAddress: "Recipient address",
          weight: "Package weight",
          service: selectedRate.service,
          carrier: selectedRate.carrier.toUpperCase(),
        });
      }
    }
  }, [selectedRateId, rates]);

  

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

  const fromCalculator = sessionStorage.getItem('calculatorData') !== null;
  const selectedRate = rates.find(rate => rate.id === selectedRateId);
  const rateAmount = selectedRate ? parseFloat(selectedRate.rate) : 0;
  
  // Calculate insurance cost and total for payment
  const insuranceCost = selectedRate?.insurance_cost || 0;
  const totalAmount = rateAmount + insuranceCost;
  
  const showPaymentSection = selectedRateId && !paymentCompleted && !labelUrl && !isCreatingLabel;

  // Create label creation page similar to international shipping
  if (labelUrl && trackingCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header similar to international shipping */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Label Created Successfully!</h1>
            <p className="text-gray-600">Your shipping label has been generated and is ready for use.</p>
          </div>

          {/* Label preview card */}
          <Card className="p-6 mb-6 bg-white shadow-lg">
            <PrintPreview 
              labelUrl={labelUrl} 
              trackingCode={trackingCode} 
              shipmentId={shipmentId}
              shipmentDetails={shipmentDetails}
              onFormatChange={async (format: string) => {
                setSelectedLabelFormat(format);
                try {
                  await handleCreateLabel(selectedRateId, shipmentId, {
                    label_format: "PDF",
                    label_size: format
                  });
                } catch (error) {
                  console.error("Error updating label format:", error);
                  toast.error("Failed to update label format");
                }
              }}
            />
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('calculatorData');
                sessionStorage.removeItem('transferToShipping');
                window.location.reload();
              }}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Ship Another Package
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              Print Label
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-6" id="shipping-rates-section">
      <Card className="border border-gray-200 shadow-lg bg-white">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <h2 className="text-xl font-bold text-blue-800 flex items-center mb-4 lg:mb-0">
              <Truck className="mr-2 h-5 w-5 text-blue-600" />
              Available Shipping Rates
            </h2>
            <div className="flex flex-wrap gap-3">
              <CarrierDropdown
                selectedCarrier={activeCarrierFilter}
                onCarrierChange={handleFilterByCarrier}
                availableCarriers={['ups', 'usps']}
              />
            </div>
          </div>
          
          {/* Label Creation Status */}
          {isCreatingLabel && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Creating Your Label...</h3>
              <p className="text-sm text-gray-600">
                Please wait while we generate your shipping label. This usually takes a few seconds.
              </p>
              <div className="mt-2">
                <div className="animate-pulse bg-yellow-200 h-2 rounded"></div>
              </div>
            </div>
          )}
          
          {!isCreatingLabel && (
            <>
              {(aiRecommendation || isAiLoading) && (
                <ShippingAIRecommendation 
                  aiRecommendation={aiRecommendation}
                  isLoading={isAiLoading}
                  onSelectRecommendation={handleSelectRate}
                />
              )}
              
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Shipping Options</h3>
                <div className="grid grid-cols-1 gap-4">
                   {filteredRates.map((rate) => (
                     <ShippingRateCard
                       key={rate.id}
                       rate={rate}
                       isSelected={selectedRateId === rate.id}
                       onSelect={handleSelectRate}
                       isBestValue={rate.id === bestValueRateId}
                       isFastest={rate.id === fastestRateId}
                       aiRecommendation={aiRecommendation && {
                         rateId: aiRecommendation.bestOverall || '',
                         reason: aiRecommendation.analysisText || ''
                       }}
                       showDiscount={true}
                       originalRate={rate.original_rate}
                       isPremium={false}
                       showPayButton={true}
                       shippingDetails={{
                         rate: rate,
                       }}
                     />
                   ))}
                </div>

                {filteredRates.length === 0 && (
                  <div className="p-6 text-center bg-gray-50 rounded-lg">
                    <p className="text-base text-gray-600">No rates match the current filter. Try changing your filter criteria.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => handleFilterByCarrier('all')} 
                      className="mt-4 h-9 px-4 text-sm"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Payment Section */}
              {showPaymentSection && (
                <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Complete Your Payment
                    </h3>
                    <div className="flex items-center gap-2 text-blue-600">
                      <CreditCard className="w-5 h-5" />
                      <span className="text-sm font-medium">Secure Checkout</span>
                    </div>
                  </div>
                  
                  {/* Cost breakdown with better styling */}
                  <div className="mb-6 p-4 bg-white rounded-lg border shadow-sm">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-gray-600">Shipping Rate:</span>
                      <span className="font-medium text-gray-900">${rateAmount.toFixed(2)}</span>
                    </div>
                    {insuranceCost > 0 && (
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-gray-600">Insurance:</span>
                        <span className="font-medium text-gray-900">${insuranceCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Payment Method Selector */}
                  <div className="bg-white rounded-lg p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Payment Method</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Change Card
                      </Button>
                    </div>
                    
                    <PaymentMethodSelector
                      selectedPaymentMethod={null}
                      onPaymentMethodChange={() => {}}
                      onPaymentComplete={(success: boolean) => {
                        if (success) {
                          setPaymentCompleted(true);
                          setIsCreatingLabel(true);
                        }
                      }}
                      amount={totalAmount}
                      description="Shipping Label Purchase"
                    />
                    
                    <div className="mt-4 flex gap-3">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                        onClick={() => {
                          setPaymentCompleted(true);
                          setIsCreatingLabel(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Complete Payment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>* All rates include handling fees and applicable taxes. Insurance charges calculated separately.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;

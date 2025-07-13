import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnhancedRateCard from './shipping/EnhancedRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import PaymentMethodSelector from './payment/PaymentMethodSelector';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { toast } from '@/components/ui/sonner';
import { CreditCard, Loader, Download, Upload, Truck, Filter, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
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
  
  useEffect(() => {
    const handlePaymentCompleted = (event: CustomEvent) => {
      console.log('Payment completed event received:', event.detail);
      if (event.detail.success) {
        setPaymentCompleted(true);
        setIsCreatingLabel(true);
        toast.success('Payment successful! Creating label...');
        
        // Trigger label creation after payment success
        const labelOptions = {
          label_format: "PDF",
          label_size: selectedLabelFormat
        };
        
        // Automatically create label after payment
        setTimeout(async () => {
          try {
            await handleCreateLabel(undefined, undefined, labelOptions);
            setIsCreatingLabel(false);
            
            // Update workflow step
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

  const handleRateSelection = (rateId: string) => {
    handleSelectRate(rateId);
    
    const calculatorData = sessionStorage.getItem('calculatorData');
    if (calculatorData) {
      toast.success("Rate selected! Complete payment to continue with label creation.", {
        duration: 5000,
      });
    }
  };

  const handleProceedForward = () => {
    if (selectedRateId) {
      selectRateAndProceed(selectedRateId);
    }
  };

  const handlePaymentComplete = (success: boolean) => {
    if (success) {
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
        } catch (error) {
          console.error('Error creating label:', error);
          setIsCreatingLabel(false);
          toast.error('Failed to create label');
        }
      }, 1000);
    }
  };

  const handlePaymentMethodChange = (paymentMethodId: string) => {
    console.log('Selected payment method:', paymentMethodId);
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
  const selectedRate = rates.find(rate => rate.id === selectedRateId);
  const rateAmount = selectedRate ? parseFloat(selectedRate.rate) : 0;
  const showPaymentSection = selectedRateId && !paymentCompleted && !labelUrl && !isCreatingLabel;

  return (
    <div className="w-full pb-6" id="shipping-rates-section">
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white/90 to-blue-50/50 backdrop-blur-lg overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center mb-4 lg:mb-0">
              <Truck className="mr-3 h-8 w-8 text-blue-600" />
              Available Shipping Rates
              <Sparkles className="ml-2 h-6 w-6 text-purple-500" />
            </h2>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:bg-blue-50 h-10 px-4 text-sm rounded-xl">
                    <Filter className="h-4 w-4" />
                    {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border border-blue-200 shadow-xl z-[9999] max-h-60 overflow-y-auto rounded-xl">
                  <DropdownMenuItem onClick={() => handleFilterByCarrier('all')} className="py-2">
                    All Carriers
                  </DropdownMenuItem>
                  {uniqueCarriers.map((carrier) => (
                    <DropdownMenuItem 
                      key={carrier} 
                      onClick={() => handleFilterByCarrier(carrier)}
                      className="py-2"
                    >
                      {carrier.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:bg-blue-50 h-10 px-4 text-sm rounded-xl">
                    Sort by: {
                      sortOrder === 'price' ? 'Price' : 
                      sortOrder === 'speed' ? 'Speed' : 
                      'Carrier'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border border-blue-200 shadow-xl z-[9999] rounded-xl">
                  <DropdownMenuItem onClick={() => setSortOrder('speed')} className="py-2">
                    Speed (Fastest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('price')} className="py-2">
                    Price (Lowest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('carrier')} className="py-2">
                    Carrier (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Label Creation Status */}
          {isCreatingLabel && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 border-2 border-yellow-200/50 rounded-2xl backdrop-blur-sm">
              <h3 className="font-bold text-yellow-800 mb-2 text-lg">Creating Your Label...</h3>
              <p className="text-sm text-gray-600">
                Please wait while we generate your shipping label. This usually takes a few seconds.
              </p>
              <div className="mt-3">
                <div className="animate-pulse bg-gradient-to-r from-yellow-200 to-orange-200 h-3 rounded-full"></div>
              </div>
            </div>
          )}
          
          {labelUrl && trackingCode && (
            <div className="mb-8">
              <PrintPreview 
                labelUrl={labelUrl} 
                trackingCode={trackingCode} 
                shipmentId={shipmentId}
                shipmentDetails={shipmentDetails}
                onFormatChange={handleLabelFormatChange}
              />
            </div>
          )}
          
          {!labelUrl && !isCreatingLabel ? (
            <>
              {(aiRecommendation || isAiLoading) && (
                <ShippingAIRecommendation 
                  aiRecommendation={aiRecommendation}
                  isLoading={isAiLoading}
                  onSelectRecommendation={handleRateSelection}
                />
              )}
              
              <div className="space-y-6 mt-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Choose Your Shipping Option</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {sortedRates.map((rate) => (
                     <EnhancedRateCard
                       key={rate.id}
                       rate={rate}
                       isSelected={selectedRateId === rate.id}
                       onSelect={handleRateSelection}
                       isBestValue={rate.id === bestValueRateId}
                       isFastest={rate.id === fastestRateId}
                       showDiscount={true}
                       originalRate={rate.original_rate}
                     />
                   ))}
                </div>

                {sortedRates.length === 0 && (
                  <div className="p-8 text-center bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-2xl backdrop-blur-sm border-2 border-gray-200/50">
                    <p className="text-lg text-gray-600 mb-4">No rates match the current filter. Try changing your filter criteria.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => handleFilterByCarrier('all')} 
                      className="h-12 px-6 text-sm bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:bg-blue-50 rounded-xl"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Section - Show when rate is selected but payment not completed */}
              {showPaymentSection && (
                <div className="mt-8 p-8 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border-2 border-blue-200/50 backdrop-blur-sm">
                  <h3 className="font-bold text-blue-800 mb-6 text-xl flex items-center">
                    <CreditCard className="mr-3 h-6 w-6" />
                    Complete Payment to Create Label
                  </h3>
                  <PaymentMethodSelector
                    selectedPaymentMethod={null}
                    onPaymentMethodChange={handlePaymentMethodChange}
                    onPaymentComplete={handlePaymentComplete}
                    amount={rateAmount}
                    description="Shipping Label Purchase"
                  />
                </div>
              )}
              
              <div className="mt-8 flex flex-wrap justify-end gap-4">
                {fromCalculator && selectedRateId && (
                  <Button 
                    onClick={handleProceedForward}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 px-6 py-3 h-12 text-sm font-semibold rounded-xl shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Proceed Forward
                  </Button>
                )}

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={!selectedRateId || isProcessingPayment}
                  variant="outline"
                  className="bg-white/80 backdrop-blur-sm border-2 border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-6 py-3 h-12 text-sm font-semibold rounded-xl"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-8 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem('calculatorData');
                  sessionStorage.removeItem('transferToShipping');
                  document.dispatchEvent(new Event('shipping-form-completed'));
                }}
                className="bg-white/80 backdrop-blur-sm border-2 border-blue-200 hover:bg-blue-50 h-12 px-6 text-sm rounded-xl"
              >
                Ship Another Package
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>* All rates include handling fees and applicable taxes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;

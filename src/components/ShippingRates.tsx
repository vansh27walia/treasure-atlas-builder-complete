import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { toast } from '@/components/ui/sonner';
import { CreditCard, Loader, Download, Upload, Truck, Filter } from 'lucide-react';
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
  const [shipmentDetails, setShipmentDetails] = useState<{ 
    fromAddress: string; 
    toAddress: string; 
    weight: string; 
    dimensions?: string; 
    service: string; 
    carrier: string; 
  } | undefined>();
  
  // Update shipment details when a rate is selected
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
  
  // Function to handle label format changes
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

  // Handle rate selection with automatic proceed option for calculator users
  const handleRateSelection = (rateId: string) => {
    handleSelectRate(rateId);
    
    // Check if this came from the rate calculator
    const calculatorData = sessionStorage.getItem('calculatorData');
    if (calculatorData) {
      // Show option to proceed to shipping form
      toast.success("Rate selected! Click 'Proceed Forward' to continue with label creation.", {
        duration: 5000,
      });
    }
  };

  // Handle proceed forward action
  const handleProceedForward = () => {
    if (selectedRateId) {
      selectRateAndProceed(selectedRateId);
    }
  };
  
  // Show empty state if no rates available
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

  // Sort the rates based on the selected sorting option
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

  // Check if user came from calculator
  const fromCalculator = sessionStorage.getItem('calculatorData') !== null;

  return (
    <div className="w-full" id="shipping-rates-section">
      <Card className="border-2 border-blue-200 shadow-xl bg-white">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-800 flex items-center mb-4 lg:mb-0">
              <Truck className="mr-3 h-6 w-6 text-blue-600" />
              Available Shipping Rates
            </h2>
            <div className="flex flex-wrap gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-2 border-blue-200 hover:bg-blue-50 h-10 px-4">
                    <Filter className="h-4 w-4" />
                    {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-2 border-blue-200 shadow-xl z-50">
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
                  <Button variant="outline" className="flex items-center gap-2 border-2 border-blue-200 hover:bg-blue-50 h-10 px-4">
                    Sort by: {
                      sortOrder === 'price' ? 'Price' : 
                      sortOrder === 'speed' ? 'Speed' : 
                      'Carrier'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-2 border-blue-200 shadow-xl z-50">
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
          
          {labelUrl && trackingCode && (
            <div className="mb-6">
              <PrintPreview 
                labelUrl={labelUrl} 
                trackingCode={trackingCode} 
                shipmentId={shipmentId}
                shipmentDetails={shipmentDetails}
                onFormatChange={handleLabelFormatChange}
              />
            </div>
          )}
          
          {!labelUrl ? (
            <>
              {/* AI Recommendations */}
              {(aiRecommendation || isAiLoading) && (
                <ShippingAIRecommendation 
                  aiRecommendation={aiRecommendation}
                  isLoading={isAiLoading}
                  onSelectRecommendation={handleRateSelection}
                />
              )}
              
              <div className="space-y-4 mt-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Available Shipping Options</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {sortedRates.map((rate) => (
                    <ShippingRateCard
                      key={rate.id}
                      rate={rate}
                      isSelected={selectedRateId === rate.id}
                      onSelect={handleRateSelection}
                      isBestValue={rate.id === bestValueRateId}
                      isFastest={rate.id === fastestRateId}
                      aiRecommendation={aiRecommendation && {
                        rateId: aiRecommendation.bestOverall || '',
                        reason: aiRecommendation.analysisText || ''
                      }}
                      showDiscount={true}
                      originalRate={rate.original_rate}
                      isPremium={false}
                    />
                  ))}
                </div>

                {sortedRates.length === 0 && (
                  <div className="p-8 text-center bg-gray-50 rounded-xl">
                    <p className="text-lg text-gray-600">No rates match the current filter. Try changing your filter criteria.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => handleFilterByCarrier('all')} 
                      className="mt-4 h-10 px-6 text-base"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex flex-wrap justify-end gap-3">
                {fromCalculator && selectedRateId && (
                  <Button 
                    onClick={handleProceedForward}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex items-center gap-2 px-6 py-3 h-12 text-base font-semibold rounded-lg shadow-lg"
                  >
                    <Download className="h-5 w-5" />
                    Proceed Forward
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    const labelOptions = {
                      label_format: "PDF",
                      label_size: selectedLabelFormat
                    };
                    handleCreateLabel(undefined, undefined, labelOptions);
                  }}
                  disabled={!selectedRateId || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white flex items-center gap-2 px-6 py-3 h-12 text-base font-semibold rounded-lg shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Creating Label...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Buy & Print Label
                    </>
                  )}
                </Button>

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={!selectedRateId || isProcessingPayment}
                  variant="outline"
                  className="border-2 border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-6 py-3 h-12 text-base font-semibold rounded-lg"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem('calculatorData');
                  sessionStorage.removeItem('transferToShipping');
                  document.dispatchEvent(new Event('shipping-form-completed'));
                }}
                className="border-2 border-blue-200 hover:bg-blue-50 h-10 px-6 text-base"
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

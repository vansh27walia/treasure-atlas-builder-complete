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
import { CreditCard, Loader, Download, Upload, Truck, Filter, ArrowRightCircle } from 'lucide-react';
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
  
  const { aiRecommendation, isAiLoading, selectRateAndProceed, updateLabelFormat } = useRateCalculator();
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
  
  // Determine if we're in calculator mode based on the URL
  const [isCalculatorMode, setIsCalculatorMode] = useState(false);
  
  useEffect(() => {
    const url = new URL(window.location.href);
    setIsCalculatorMode(url.searchParams.get('tab') === 'calculator');
  }, []);
  
  // Update shipment details when a rate is selected
  useEffect(() => {
    if (selectedRateId && rates.length > 0) {
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      if (selectedRate) {
        // Construct basic shipment details
        setShipmentDetails({
          fromAddress: "Your shipping address",
          toAddress: "Recipient address",
          weight: `${selectedRate.parcel?.weight || 'Unknown'} oz`,
          dimensions: selectedRate.parcel ? 
            `${selectedRate.parcel.length}" x ${selectedRate.parcel.width}" x ${selectedRate.parcel.height}"` : 
            undefined,
          service: selectedRate.service,
          carrier: selectedRate.carrier.toUpperCase(),
        });
      }
    }
  }, [selectedRateId, rates]);
  
  // Function to handle label format changes
  const handleLabelFormatChange = async (format: string): Promise<void> => {
    setSelectedLabelFormat(format);
    
    if (updateLabelFormat) {
      try {
        console.log("Regenerating label with new format:", format);
        await updateLabelFormat(format);
      } catch (error) {
        console.error("Error updating label format:", error);
        toast.error("Failed to update label format");
        throw error;
      }
    } else if (selectedRateId && shipmentId && labelUrl) {
      try {
        console.log("Using fallback method to regenerate label with format:", format);
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

  // Show empty state if no rates available
  if (rates.length === 0) {
    return (
      <div className="mt-8 w-full" id="shipping-rates-section">
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

  return (
    <div className="mt-8 w-full px-4" id="shipping-rates-section">
      <Card className="border border-gray-200 shadow-md rounded-xl overflow-hidden w-full">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 flex items-center mb-3 md:mb-0">
              <Truck className="mr-2 h-6 w-6 text-blue-600" />
              Available Shipping Rates
            </h2>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                    <Filter className="h-4 w-4" />
                    {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
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
                  <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                    Sort by: {
                      sortOrder === 'price' ? 'Price' : 
                      sortOrder === 'speed' ? 'Speed' : 
                      'Carrier'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
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
                  onSelectRecommendation={handleSelectRate}
                />
              )}
              
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">All Available Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedRates.map((rate) => (
                    <ShippingRateCard
                      key={rate.id}
                      rate={rate}
                      isSelected={selectedRateId === rate.id}
                      onSelect={isCalculatorMode ? selectRateAndProceed : handleSelectRate}
                      isBestValue={rate.id === bestValueRateId}
                      isFastest={rate.id === fastestRateId}
                      aiRecommendation={aiRecommendation && {
                        rateId: aiRecommendation.bestOverall || '',
                        reason: aiRecommendation.analysisText || ''
                      }}
                      showDiscount={true}
                      originalRate={rate.original_rate}
                      isPremium={false}
                      data-rate-id={rate.id}
                    />
                  ))}
                </div>

                {sortedRates.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">No rates match the current filter. Try changing your filter criteria.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => handleFilterByCarrier('all')} 
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex flex-wrap justify-end gap-4">
                {/* Show "Use Selected Rate" button when in calculator mode */}
                {isCalculatorMode && selectedRateId && (
                  <Button 
                    onClick={() => selectRateAndProceed(selectedRateId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 py-2 h-12 text-base"
                  >
                    <ArrowRightCircle className="h-5 w-5" />
                    Use Selected Rate
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    // Set up label options based on selected format
                    const labelOptions = {
                      label_format: "PDF",
                      label_size: selectedLabelFormat
                    };
                    
                    // Call handleCreateLabel with the selected format
                    handleCreateLabel(selectedRateId, shipmentId, labelOptions);
                  }}
                  disabled={!selectedRateId || isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-6 py-2 h-12 text-base"
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
                  className="border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-6 py-2 h-12 text-base"
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
            <div className="mt-4">
              <ShippingLabel 
                labelUrl={labelUrl} 
                trackingCode={trackingCode} 
                shipmentId={shipmentId}
                onFormatChange={handleLabelFormatChange}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => document.dispatchEvent(new Event('shipping-form-completed'))}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  Ship Another Package
                </Button>
              </div>
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

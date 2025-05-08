
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import ShippingWorkflow from './shipping/ShippingWorkflow';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { toast } from '@/components/ui/sonner';
import { CreditCard, Loader, Download, Upload, Truck, Filter, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  
  const { aiRecommendation, isAiLoading } = useRateCalculator();
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier' | 'premium'>('premium');
  
  // Show empty state if no rates available
  if (rates.length === 0) {
    return (
      <div className="mt-8 w-full" id="shipping-rates-section">
        <ShippingWorkflow currentStep="rates" />
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

  // Identify premium services (typically express, overnight, or most expensive)
  const identifyPremiumRates = (ratesList) => {
    // Clone the array to avoid modifying the original
    const ratesWithPremium = [...ratesList];
    
    // Sort by price to identify the most expensive options
    const sortedByPrice = [...ratesList].sort((a, b) => 
      parseFloat(b.rate) - parseFloat(a.rate)
    );
    
    // Mark top 30% as premium
    const premiumCount = Math.ceil(sortedByPrice.length * 0.3);
    const premiumThreshold = sortedByPrice[Math.min(premiumCount - 1, sortedByPrice.length - 1)].rate;
    
    // Also mark as premium if service name contains these keywords
    const premiumKeywords = ['express', 'priority', 'overnight', 'next day', 'same day', 'instant'];
    
    return ratesWithPremium.map(rate => ({
      ...rate,
      isPremium: 
        parseFloat(rate.rate) >= parseFloat(premiumThreshold) || 
        premiumKeywords.some(keyword => 
          rate.service.toLowerCase().includes(keyword)
        )
    }));
  };

  // Add premium flag to rates
  const ratesWithPremium = identifyPremiumRates(rates);
  
  // Sort the rates based on the selected sorting option
  const sortedRates = [...ratesWithPremium].sort((a, b) => {
    if (sortOrder === 'premium') {
      // Premium rates first, then sort by other criteria within each group
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      // If both are premium or both are not, sort by speed
      const aDays = a.delivery_days || 999;
      const bDays = b.delivery_days || 999;
      return aDays - bDays;
    } else if (sortOrder === 'price') {
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
      <ShippingWorkflow currentStep={labelUrl ? 'label' : 'rates'} />
      <Card className="border-2 border-gray-200 shadow-md rounded-xl overflow-hidden w-full">
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 flex items-center">
              <Truck className="mr-2 h-6 w-6 text-blue-600" />
              Available Shipping Rates
            </h2>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                    <Filter className="h-4 w-4" />
                    {activeCarrierFilter === 'all' ? 'All Carriers' : activeCarrierFilter.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
                      sortOrder === 'premium' ? 'Premium' : 
                      sortOrder === 'price' ? 'Price' : 
                      sortOrder === 'speed' ? 'Speed' : 
                      'Carrier'
                    }
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuItem onClick={() => setSortOrder('premium')}>
                    <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
                    Premium Options First
                  </DropdownMenuItem>
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
              
              <Link to="/bulk-upload">
                <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                  <Upload className="h-4 w-4" />
                  Bulk Upload
                </Button>
              </Link>
            </div>
          </div>
          
          <ShippingLabel 
            labelUrl={labelUrl} 
            trackingCode={trackingCode} 
            shipmentId={shipmentId}
          />
          
          {!labelUrl && (
            <>
              {/* Premium Recommendations - Show at the top */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-amber-400" />
                  Recommended Premium Services
                </h3>
                <div className="space-y-4">
                  {sortedRates.filter(rate => rate.isPremium).slice(0, 3).map((rate) => (
                    <ShippingRateCard
                      key={`premium-${rate.id}`}
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
                      isPremium={true}
                    />
                  ))}
                </div>
              </div>
            
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
                {sortedRates.map((rate) => (
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
                    isPremium={rate.isPremium}
                  />
                ))}

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
                <Button 
                  onClick={() => handleCreateLabel()}
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

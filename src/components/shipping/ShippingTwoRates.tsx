
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './ShippingRateCard';
import ShippingLabel from './ShippingLabel';
import EmptyRatesState from './EmptyRatesState';
import ShippingAIRecommendation from './ShippingAIRecommendation';
import { useShippingRates } from '@/hooks/useShippingRates';
import useRateCalculator from '@/hooks/useRateCalculator';
import { CreditCard, Loader, Download, Upload, Truck, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ShippingTwoRates: React.FC = () => {
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
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-2xl font-semibold text-indigo-800 flex items-center mb-3 md:mb-0">
              <Truck className="mr-2 h-6 w-6 text-indigo-600" />
              Available Shipping Rates
            </h2>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50">
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
                  <Button variant="outline" className="flex items-center gap-2 border-indigo-200 hover:bg-indigo-50">
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
              
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                <TabsList className="border border-indigo-200 bg-transparent">
                  <TabsTrigger 
                    value="grid" 
                    className="data-[state=active]:bg-indigo-100"
                  >
                    Grid
                  </TabsTrigger>
                  <TabsTrigger 
                    value="list" 
                    className="data-[state=active]:bg-indigo-100"
                  >
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <ShippingLabel 
            labelUrl={labelUrl} 
            trackingCode={trackingCode} 
            shipmentId={shipmentId}
          />
          
          {!labelUrl && (
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
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
                  : "flex flex-col space-y-3"
                }>
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
                      isCompact={viewMode === 'list'}
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
                <Button 
                  onClick={() => handleCreateLabel()}
                  disabled={!selectedRateId || isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 py-2 h-12 text-base"
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
                  className="border-indigo-300 hover:bg-indigo-50 flex items-center gap-2 px-6 py-2 h-12 text-base"
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

export default ShippingTwoRates;

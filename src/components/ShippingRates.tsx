
import React, { useState } from 'react';
import { useShippingRates } from '@/hooks/useShippingRates';
import ShippingRateCard from './shipping/ShippingRateCard';
import { Button } from '@/components/ui/button';
import { PackageCheck, ShoppingCart, Loader2, Filter } from 'lucide-react';

const ShippingRates: React.FC = () => {
  const {
    rates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment,
    handleFilterByCarrier
  } = useShippingRates();
  
  // Group rates by carrier for better organization
  const [showAllRates, setShowAllRates] = useState(false);
  const maxVisibleRatesPerCarrier = 3;
  
  // Group rates by carrier
  const groupedRates: Record<string, typeof rates> = {};
  rates.forEach(rate => {
    const carrier = rate.carrier.toUpperCase();
    if (!groupedRates[carrier]) {
      groupedRates[carrier] = [];
    }
    groupedRates[carrier].push(rate);
  });

  // Early return for loading state
  if (isLoading) {
    return (
      <div 
        id="shipping-rates-section"
        className="flex flex-col items-center justify-center p-8 mt-8 rounded-lg border border-blue-100 bg-blue-50"
      >
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <h3 className="text-xl font-medium text-blue-800">Fetching Shipping Rates...</h3>
        <p className="text-blue-600 mt-2">We're finding the best shipping options for your package</p>
      </div>
    );
  }

  // Early return for empty state
  if (rates.length === 0) {
    return null;
  }

  // Don't show rates section if we already have a label
  if (labelUrl) {
    return null;
  }

  // Render shipping rates grouped by carrier
  return (
    <div 
      id="shipping-rates-section" 
      className="mt-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <PackageCheck className="mr-2 h-5 w-5 text-blue-600" />
          Available Shipping Options
        </h2>
        
        {uniqueCarriers.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Filter:</span>
            
            <div className="flex gap-2">
              <Button
                variant={activeCarrierFilter === 'all' ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleFilterByCarrier('all')}
              >
                All
              </Button>
              
              {uniqueCarriers.map(carrier => (
                <Button
                  key={carrier}
                  variant={activeCarrierFilter === carrier ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => handleFilterByCarrier(carrier)}
                >
                  {carrier}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-8">
        {Object.entries(groupedRates).map(([carrier, carrierRates]) => {
          // Only show limited number of rates per carrier unless "show all" is clicked
          const displayRates = showAllRates ? 
            carrierRates : 
            carrierRates.slice(0, maxVisibleRatesPerCarrier);
            
          return (
            <div key={carrier} className="border-b pb-6 last:border-b-0">
              <h3 className="font-medium text-gray-700 mb-4 flex items-center">
                {carrier} Shipping Options
                <span className="ml-2 text-sm text-gray-500">({carrierRates.length} options)</span>
              </h3>
              
              <div className="space-y-4">
                {displayRates.map(rate => (
                  <ShippingRateCard
                    key={rate.id}
                    rate={rate}
                    isSelected={selectedRateId === rate.id}
                    onSelect={handleSelectRate}
                    isBestValue={bestValueRateId === rate.id}
                    isFastest={fastestRateId === rate.id}
                    showDiscount={true}
                  />
                ))}
              </div>
              
              {!showAllRates && carrierRates.length > maxVisibleRatesPerCarrier && (
                <Button 
                  variant="ghost" 
                  className="mt-2 text-blue-600 hover:text-blue-800"
                  onClick={() => setShowAllRates(true)}
                >
                  Show all {carrier} options ({carrierRates.length - maxVisibleRatesPerCarrier} more)
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {selectedRateId && (
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => handleCreateLabel()}
            disabled={isProcessingPayment}
            className="sm:w-auto w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Label
          </Button>
          
          <Button
            onClick={handleProceedToPayment}
            disabled={isLoading || isProcessingPayment}
            className="sm:w-auto w-full"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isProcessingPayment ? "Processing..." : "Pay & Ship"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShippingRates;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import { useShippingRates } from '@/hooks/useShippingRates';
import { toast } from '@/components/ui/sonner';
import { CreditCard } from 'lucide-react';

const ShippingRates: React.FC = () => {
  const navigate = useNavigate();
  const {
    rates,
    isLoading,
    selectedRateId,
    labelUrl,
    trackingCode,
    bestValueRateId,
    fastestRateId,
    handleSelectRate,
    handleCreateLabel
  } = useShippingRates();

  // Show empty state if no rates available
  if (rates.length === 0) {
    return <div className="mt-8"><EmptyRatesState /></div>;
  }

  // Find the selected rate for payment processing
  const selectedRate = rates.find(rate => rate.id === selectedRateId);

  const handleProceedToPayment = () => {
    if (!selectedRateId || !selectedRate) {
      toast.error("Please select a shipping rate first");
      return;
    }

    // Extract the amount from the selected rate
    const amount = Math.round(parseFloat(selectedRate.rate) * 100); // Convert to cents
    
    // Navigate to payment page with rate information
    navigate(`/payment?amount=${amount}&shipmentId=${selectedRate.shipment_id || ''}&rateId=${selectedRate.id}`);
  };

  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Available Shipping Rates</h2>
          
          <ShippingLabel labelUrl={labelUrl} trackingCode={trackingCode} />
          
          <div className="space-y-4">
            {rates.map((rate) => (
              <ShippingRateCard
                key={rate.id}
                rate={rate}
                isSelected={selectedRateId === rate.id}
                onSelect={handleSelectRate}
                isBestValue={rate.id === bestValueRateId}
                isFastest={rate.id === fastestRateId}
              />
            ))}
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <Button 
              onClick={handleCreateLabel}
              disabled={!selectedRateId || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Creating Label...' : 'Buy & Print Label'}
            </Button>

            <Button 
              onClick={handleProceedToPayment}
              disabled={!selectedRateId}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Proceed to Payment
            </Button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>* Actual rates provided by EasyPost.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '@/components/shipping/CarrierLogo';
import CarrierDropdown from '@/components/shipping/CarrierDropdown';
import { useShippingRates } from '@/hooks/useShippingRates';
import EmptyRatesState from '@/components/shipping/EmptyRatesState';
import InsuranceCalculator from '@/components/shipping/InsuranceCalculator';

const ShippingRates = () => {
  const {
    rates: filteredRates,
    allRates,
    isLoading,
    selectedRateId,
    uniqueCarriers,
    activeCarrierFilter,
    handleSelectRate,
    handleCreateLabel,
    handleFilterByCarrier
  } = useShippingRates();

  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleAcceptPayment = async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }

    setIsProcessingPayment(true);
    try {
      await handleCreateLabel();
      toast.success('Payment processed and label created successfully!');
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleChangeCard = () => {
    // Open payment method selection modal
    setPaymentMethod(null);
    // Logic to show payment method selection
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shipping Rates</h2>
        
        {/* Carrier Dropdown with Logos */}
        <div className="w-64">
          <CarrierDropdown
            selectedCarrier={activeCarrierFilter}
            onCarrierChange={handleFilterByCarrier}
            availableCarriers={uniqueCarriers}
          />
        </div>
      </div>

      {filteredRates.length === 0 && !isLoading ? (
        <EmptyRatesState />
      ) : (
        <div className="grid gap-4">
          {isLoading ? (
            <Card className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
              </CardContent>
            </Card>
          ) : (
            filteredRates.map((rate) => (
              <Card
                key={rate.id}
                className={`border-2 transition-shadow hover:shadow-md cursor-pointer ${
                  selectedRateId === rate.id
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-gray-200'
                }`}
                data-rate-id={rate.id}
                onClick={() => handleSelectRate(rate.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <CarrierLogo carrier={rate.carrier} size="sm" />
                        <span className="font-medium">{rate.carrier} - {rate.service}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Delivery: {rate.delivery_days} business days
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">${rate.rate}</div>
                      {selectedRateId === rate.id && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Payment Section - Improved UI */}
      {selectedRateId && (
        <Card className="border-2 border-blue-300 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">Payment & Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected Rate</p>
                <p className="font-semibold">
                  {filteredRates.find(rate => rate.id === selectedRateId)?.carrier} - {filteredRates.find(rate => rate.id === selectedRateId)?.service}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  ${filteredRates.find(rate => rate.id === selectedRateId)?.rate}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button 
                onClick={handleAcceptPayment}
                disabled={isProcessingPayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessingPayment ? 'Processing...' : 'Accept Payment'}
              </Button>
              
              <Button 
                onClick={handleChangeCard}
                variant="outline"
                className="px-6"
              >
                Change Card
              </Button>
            </div>

            {paymentMethod && (
              <div className="text-sm text-gray-600 p-3 bg-white rounded border">
                <p>Payment Method: {paymentMethod.brand} ending in {paymentMethod.last4}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Insurance Calculator */}
      <InsuranceCalculator />
    </div>
  );
};

export default ShippingRates;

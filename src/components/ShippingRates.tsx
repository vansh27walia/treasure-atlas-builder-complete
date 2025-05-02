
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import { useShippingRates } from '@/hooks/useShippingRates';
import { toast } from '@/components/ui/sonner';
import { CreditCard, Loader, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';

const ShippingRates: React.FC = () => {
  const {
    rates,
    isLoading,
    isProcessingPayment,
    selectedRateId,
    labelUrl,
    trackingCode,
    shipmentId,
    bestValueRateId,
    fastestRateId,
    handleSelectRate,
    handleCreateLabel,
    handleProceedToPayment
  } = useShippingRates();

  // Show empty state if no rates available
  if (rates.length === 0) {
    return (
      <div className="mt-8">
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

  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Available Shipping Rates</h2>
            <Link to="/bulk-upload">
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Upload
              </Button>
            </Link>
          </div>
          
          <ShippingLabel 
            labelUrl={labelUrl} 
            trackingCode={trackingCode} 
            shipmentId={shipmentId}
          />
          
          <div className="space-y-4 mt-6">
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
          
          <div className="mt-6 flex flex-wrap justify-end gap-4">
            <Button 
              onClick={handleCreateLabel}
              disabled={!selectedRateId || isLoading}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating Label...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Buy & Print Label
                </>
              )}
            </Button>

            <Button 
              onClick={handleProceedToPayment}
              disabled={!selectedRateId || isProcessingPayment}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50 flex items-center gap-2"
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
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>* All rates include handling fees and applicable taxes</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;

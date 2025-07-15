import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";
import { ShippingRate } from '@/hooks/useShippingRates';
import RateDropdownSelector from './RateDropdownSelector';

interface ShippingRatesProps {
  // Add any props you need here
}

interface EmptyRatesStateProps {
  // Add any props you need here
}

const EmptyRatesState: React.FC<EmptyRatesStateProps> = () => {
  return (
    <Card className="p-6 text-center">
      <h3 className="text-lg font-semibold text-gray-700">No Shipping Rates Available</h3>
      <p className="text-sm text-gray-500 mt-2">
        Adjust your shipment details and try again.
      </p>
    </Card>
  );
};

const ShippingRates: React.FC<ShippingRatesProps> = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [shipmentId, setShipmentId] = useState<string>('');
  const [selectedAiMetric, setSelectedAiMetric] = useState<string>('');

  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent) => {
      if (event.detail && event.detail.rates) {
        setRates(event.detail.rates);
        setShipmentId(event.detail.shipmentId);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        toast.error("Failed to retrieve shipping rates.");
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);

    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    };
  }, []);

  const handleSelectRate = (rateId: string) => {
    setSelectedRate(rateId);
  };

  const handleCreateLabel = async (rateId: string) => {
    setIsLoading(true);
    try {
      const selectedRateData = rates.find(rate => rate.id === rateId);

      if (!selectedRateData) {
        throw new Error("Selected rate not found");
      }

      const payload = {
        shipmentId: shipmentId,
        rateId: selectedRateData.id,
        insuranceValue: selectedRateData.insurance_cost || 0
      };

      const { data, error } = await supabase.functions.invoke('purchase-shipping-label', {
        body: payload,
      });

      if (error) {
        throw new Error(`Error purchasing label: ${error.message}`);
      }

      if (data?.labelData?.label_url) {
        window.open(data.labelData.label_url, '_blank');
        toast.success("Shipping label created successfully!");
      } else {
        toast.error("Failed to create shipping label.");
      }
    } catch (error) {
      console.error('Error creating shipping label:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create shipping label");
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for AI metric changes
  useEffect(() => {
    const handleAiMetricSelected = (event: CustomEvent) => {
      if (event.detail && event.detail.metric && event.detail.rates) {
        setSelectedAiMetric(event.detail.metric);
        setRates(event.detail.rates);
        if (event.detail.rates.length > 0) {
          setSelectedRate(event.detail.rates[0].id);
        }
      }
    };

    document.addEventListener('ai-metric-selected', handleAiMetricSelected as EventListener);
    
    return () => {
      document.removeEventListener('ai-metric-selected', handleAiMetricSelected as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg">Loading shipping rates...</span>
        </div>
      </Card>
    );
  }

  if (rates.length === 0) {
    return <EmptyRatesState />;
  }

  return (
    <Card className="border shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="h-6 w-6 text-blue-600" />
          Available Shipping Rates
        </h2>
        <p className="text-muted-foreground mt-1">
          {rates.length} rate{rates.length !== 1 ? 's' : ''} found. Select your preferred option.
        </p>
      </div>

      <div className="p-6">
        <RateDropdownSelector
          rates={rates}
          onRateSelect={setSelectedRate}
          onRatesReorder={setRates}
          selectedAiMetric={selectedAiMetric}
        />

        {selectedRate && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Ready to create your label?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Selected rate: {rates.find(r => r.id === selectedRate)?.carrier} - {rates.find(r => r.id === selectedRate)?.service}
                </p>
              </div>
              <Button 
                onClick={() => handleCreateLabel(selectedRate)}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
              >
                Create Shipping Label
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShippingRates;

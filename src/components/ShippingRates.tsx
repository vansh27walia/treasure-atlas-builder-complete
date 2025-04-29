
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Truck, Tag, Shield, Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from "@/integrations/supabase/client";

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  list_rate?: string;
  retail_rate?: string;
  est_delivery_days?: number;
}

interface EasyPostRatesEvent {
  detail: {
    rates: ShippingRate[];
    shipmentId: string;
  }
}

const ShippingRates: React.FC = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // Listen for rates from the shipping form component
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent<EasyPostRatesEvent>) => {
      if (event.detail && event.detail.rates) {
        setRates(event.detail.rates);
        setShipmentId(event.detail.shipmentId);
        setSelectedRateId(null);
        setLabelUrl(null);
        setTrackingCode(null);
      }
    };

    document.addEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    
    return () => {
      document.removeEventListener('easypost-rates-received', handleRatesReceived as EventListener);
    };
  }, []);

  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };

  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error("Please select a shipping rate first");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { shipmentId, rateId: selectedRateId }
      });

      if (error) {
        throw new Error(`Error creating label: ${error.message}`);
      }

      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      toast.success("Shipping label generated successfully");
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error("Failed to generate shipping label");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to determine the best value rate
  const getBestValueRate = () => {
    if (rates.length === 0) return null;
    
    // Sort by price and delivery days to find the best value
    const sortedRates = [...rates].sort((a, b) => {
      // First compare price
      const aPrice = parseFloat(a.rate);
      const bPrice = parseFloat(b.rate);
      if (aPrice !== bPrice) return aPrice - bPrice;
      
      // If price is the same, compare delivery days
      return (a.delivery_days || 999) - (b.delivery_days || 999);
    });
    
    return sortedRates[0]?.id;
  };

  // Function to determine the fastest rate
  const getFastestRate = () => {
    if (rates.length === 0) return null;
    
    // Sort by delivery days to find the fastest
    const sortedRates = [...rates].sort((a, b) => 
      (a.delivery_days || 999) - (b.delivery_days || 999)
    );
    
    return sortedRates[0]?.id;
  };

  const bestValueRateId = getBestValueRate();
  const fastestRateId = getFastestRate();

  // Show sample rates if no real rates available
  if (rates.length === 0) {
    return (
      <div className="mt-8">
        <Card className="border-2 border-gray-200">
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Available Shipping Rates</h2>
            <p className="text-center py-8 text-gray-500">
              Fill out the shipping form and click "Show Shipping Rates" to see available rates.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Available Shipping Rates</h2>
          
          {labelUrl && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div>
                  <h3 className="font-semibold text-green-800">Label Generated Successfully!</h3>
                  <p className="text-sm text-green-700">Tracking Number: {trackingCode}</p>
                </div>
                <a 
                  href={labelUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Label
                </a>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {rates.map((rate) => (
              <div 
                key={rate.id} 
                className={`border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-gray-50 ${
                  selectedRateId === rate.id ? 'border-2 border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-semibold text-lg">{rate.carrier} {rate.service}</div>
                    {rate.id === bestValueRateId && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Best Value
                      </span>
                    )}
                    {rate.id === fastestRateId && (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Fastest
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {rate.delivery_days ? 
                          `Est. delivery: ${rate.delivery_days} business days` : 
                          'Delivery estimate not available'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 flex items-center">
                  <div className="mr-6 text-right">
                    <div className="text-2xl font-bold">${parseFloat(rate.rate).toFixed(2)}</div>
                    {rate.retail_rate && (
                      <div className="text-xs text-gray-500">
                        Retail: ${parseFloat(rate.retail_rate).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <Button 
                    variant={selectedRateId === rate.id ? "default" : "outline"}
                    onClick={() => handleSelectRate(rate.id)}
                  >
                    {selectedRateId === rate.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleCreateLabel}
              disabled={!selectedRateId || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? 'Creating Label...' : 'Buy & Print Label'}
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


import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Clock, 
  CreditCard, 
  Loader, 
  Package, 
  Truck, 
  AlertCircle 
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { carrierService, ShippingOption } from '@/services/CarrierService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useShippingLabel } from '@/hooks/useShippingLabel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ShippingRates: React.FC = () => {
  const navigate = useNavigate();
  const { createLabel, navigateToSuccessPage, isCreatingLabel } = useShippingLabel();
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Listen for rates from the form component
  useEffect(() => {
    const handleRatesUpdated = (event: CustomEvent<{ rates: ShippingOption[] }>) => {
      setRates(event.detail.rates);
      setShipmentId(event.detail.rates[0]?.shipment_id || null);
      setIsVisible(true);
      setError(null);
    };

    // Register event listener
    document.addEventListener('shipping-rates-updated', handleRatesUpdated as EventListener);
    
    return () => {
      document.removeEventListener('shipping-rates-updated', handleRatesUpdated as EventListener);
    };
  }, []);

  // Sort rates by price
  const sortedRates = [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

  // Calculate estimated delivery date
  const getEstimatedDeliveryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle rate selection
  const handleRateSelect = (rateId: string) => {
    setSelectedRateId(rateId);
    
    // Update workflow step
    document.dispatchEvent(new CustomEvent('shipping-step-change', { 
      detail: { step: 'label' }
    }));
  };

  // Handle purchasing the label
  const handlePurchaseLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error('Please select a shipping option first');
      return;
    }

    if (isCreatingLabel) {
      // Prevent duplicate clicks
      return;
    }

    setError(null);

    try {
      const labelResult = await createLabel(shipmentId, selectedRateId);
      
      if (labelResult) {
        navigateToSuccessPage(labelResult);
      }
    } catch (error) {
      console.error('Error in handlePurchaseLabel:', error);
      setError('Failed to create shipping label. Please try again.');
    }
  };

  // Don't render anything if there are no rates or the component shouldn't be visible
  if (!isVisible || rates.length === 0) {
    return null;
  }

  return (
    <div id="shipping-rates-section" className="mt-8">
      <Card className="border-2 border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-blue-800">
            <Package className="mr-2 h-5 w-5 text-blue-600" />
            Available Shipping Options
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {sortedRates.map((rate) => (
              <div 
                key={rate.id} 
                className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                  selectedRateId === rate.id 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'hover:bg-gray-50 border-gray-200'
                }`}
                onClick={() => handleRateSelect(rate.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`rate-${rate.id}`}
                      checked={selectedRateId === rate.id}
                      onChange={() => handleRateSelect(rate.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`rate-${rate.id}`} className="ml-3 block">
                      <div className="font-medium text-gray-900">{rate.carrier} {rate.service}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {rate.delivery_days
                          ? `Estimated delivery: ${getEstimatedDeliveryDate(rate.delivery_days)}`
                          : 'Delivery estimate not available'}
                      </div>
                    </label>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-700">${parseFloat(rate.rate).toFixed(2)}</div>
                    {rate.list_rate && rate.list_rate !== rate.rate && (
                      <div className="text-xs text-gray-500 line-through">${parseFloat(rate.list_rate).toFixed(2)}</div>
                    )}
                  </div>
                </div>
                
                {/* Optional: Additional details in accordion */}
                {(rate.est_delivery_days || rate.list_rate || rate.retail_rate) && (
                  <Accordion type="single" collapsible className="mt-2">
                    <AccordionItem value="details">
                      <AccordionTrigger className="text-sm text-gray-500 py-1">
                        More details
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm text-gray-600 space-y-1">
                          {rate.est_delivery_days && (
                            <div>Estimated transit days: {rate.est_delivery_days}</div>
                          )}
                          {rate.list_rate && (
                            <div>List rate: ${parseFloat(rate.list_rate).toFixed(2)}</div>
                          )}
                          {rate.retail_rate && (
                            <div>Retail rate: ${parseFloat(rate.retail_rate).toFixed(2)}</div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handlePurchaseLabel}
              disabled={!selectedRateId || isCreatingLabel}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              size="lg"
            >
              {isCreatingLabel ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Creating Label...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Create Label
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShippingRates;

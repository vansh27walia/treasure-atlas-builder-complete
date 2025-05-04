
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ShippingRateCard from './shipping/ShippingRateCard';
import ShippingLabel from './shipping/ShippingLabel';
import EmptyRatesState from './shipping/EmptyRatesState';
import ShippingAIRecommendation from './shipping/ShippingAIRecommendation';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, Loader, Download, Upload, Truck, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import useRateCalculator from '@/hooks/useRateCalculator';

const ShippingRates: React.FC = () => {
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'price' | 'speed' | 'carrier'>('price');
  const [filterCarrier, setFilterCarrier] = useState<string | null>(null);
  
  const { aiRecommendation, isAiLoading } = useRateCalculator();
  
  // Listen for rates from the shipping form component
  useEffect(() => {
    const handleRatesReceived = (event: CustomEvent<any>) => {
      if (event.detail && event.detail.rates) {
        // Add shipmentId to each rate object
        const ratesWithShipmentId = event.detail.rates.map((rate: any) => ({
          ...rate,
          shipment_id: event.detail.shipmentId
        }));
        
        setRates(ratesWithShipmentId);
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
    if (!selectedRateId) {
      toast({
        title: "Error",
        description: "Please select a shipping rate first",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate label generation for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, create a dummy URL for now
      const dummyLabelUrl = "https://easypost-files.s3.us-west-2.amazonaws.com/files/postage_label/20180301/5535fdb3d2594269b4e0c927e8785730.pdf";
      const dummyTrackingCode = "9400100948730123457891";
      
      setLabelUrl(dummyLabelUrl);
      setTrackingCode(dummyTrackingCode);
      
      toast({
        title: "Success",
        description: "Shipping label generated successfully"
      });
      
    } catch (error) {
      console.error('Error creating label:', error);
      toast({
        title: "Error",
        description: "Failed to generate shipping label. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedRateId) {
      toast({
        title: "Error",
        description: "Please select a shipping rate first",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessingPayment(false);
        toast({
          title: "Success",
          description: "Payment processed successfully"
        });
        
        // Create label after payment
        handleCreateLabel();
      }, 1500);
      
    } catch (error) {
      console.error('Error proceeding to payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
      setIsProcessingPayment(false);
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
  
  // Show empty state if no rates available
  if (rates.length === 0) {
    return (
      <div className="mt-8" id="shipping-rates-section">
        <EmptyRatesState />
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

  // Apply carrier filter if selected
  const filteredRates = filterCarrier 
    ? sortedRates.filter(rate => rate.carrier.toLowerCase().includes(filterCarrier.toLowerCase()))
    : sortedRates;

  // Get unique carriers for filtering
  const carriers = [...new Set(rates.map(rate => rate.carrier))];

  return (
    <div className="mt-8" id="shipping-rates-section">
      <Card className="border-2 border-gray-200 shadow-md rounded-xl overflow-hidden">
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
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterCarrier(null)}>
                    All Carriers
                  </DropdownMenuItem>
                  {carriers.map((carrier) => (
                    <DropdownMenuItem 
                      key={carrier} 
                      onClick={() => setFilterCarrier(carrier)}
                    >
                      {carrier}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 border-blue-200 hover:bg-blue-50">
                    Sort by: {sortOrder === 'price' ? 'Price' : sortOrder === 'speed' ? 'Speed' : 'Carrier'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortOrder('price')}>
                    Price (Lowest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('speed')}>
                    Speed (Fastest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortOrder('carrier')}>
                    Carrier (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
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
                {filteredRates.map((rate) => (
                  <ShippingRateCard
                    key={rate.id}
                    rate={rate}
                    isSelected={selectedRateId === rate.id}
                    onSelect={handleSelectRate}
                    isBestValue={rate.id === bestValueRateId}
                    isFastest={rate.id === fastestRateId}
                    aiRecommendation={aiRecommendation || undefined}
                  />
                ))}

                {filteredRates.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-gray-600">No rates match the current filter. Try changing your filter criteria.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setFilterCarrier(null)} 
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex flex-wrap justify-end gap-4">
                <Button 
                  onClick={handleCreateLabel}
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

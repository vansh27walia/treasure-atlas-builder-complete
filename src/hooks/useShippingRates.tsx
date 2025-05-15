
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { ShippingRate } from '@/types/shipping';

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [labelUrl, setLabelUrl] = useState<string>('');
  const [trackingCode, setTrackingCode] = useState<string>('');
  const [shipmentId, setShipmentId] = useState<string>('');
  const [bestValueRateId, setBestValueRateId] = useState<string>('');
  const [fastestRateId, setFastestRateId] = useState<string>('');
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  
  const navigate = useNavigate();

  // Reset all shipping state
  const resetShippingState = useCallback(() => {
    setRates([]);
    setAllRates([]);
    setSelectedRateId('');
    setLabelUrl('');
    setTrackingCode('');
    setShipmentId('');
    setBestValueRateId('');
    setFastestRateId('');
    setActiveCarrierFilter('all');
  }, []);
  
  // Mock function to select a rate
  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };
  
  // Mock function to create a label
  const handleCreateLabel = async () => {
    if (!selectedRateId) {
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Simulate success
      setLabelUrl('https://example.com/shipping-label.pdf');
      setTrackingCode('TRACK1234567890US');
      setShipmentId('ship_123456789');
      setIsLoading(false);
      
      toast({
        title: "Label Created",
        description: "Your shipping label has been successfully created.",
      });
    }, 1500);
  };
  
  // Mock function to handle payment
  const handleProceedToPayment = () => {
    if (!selectedRateId) {
      return;
    }
    
    setIsProcessingPayment(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsProcessingPayment(false);
      navigate('/payment', { 
        state: { 
          rateId: selectedRateId,
          amount: rates.find(r => r.id === selectedRateId)?.rate || 0
        } 
      });
    }, 1000);
  };
  
  // Filter rates by carrier
  const handleFilterByCarrier = (carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      const filteredRates = allRates.filter(rate => rate.carrier === carrier);
      setRates(filteredRates);
    }
  };
  
  // Fetch rates on component mount
  useEffect(() => {
    const fetchRates = async () => {
      const mockRates: ShippingRate[] = [
        {
          id: 'rate_1',
          carrier: 'ups',
          service: 'UPS Ground',
          rate: 12.99,
          currency: 'USD',
          delivery_days: 3,
          estimated_delivery_date: '2023-06-25',
          original_rate: 15.99
        },
        {
          id: 'rate_2',
          carrier: 'usps',
          service: 'USPS Priority',
          rate: 9.99,
          currency: 'USD',
          delivery_days: 4,
          estimated_delivery_date: '2023-06-26',
          original_rate: 11.99
        },
        {
          id: 'rate_3',
          carrier: 'fedex',
          service: 'FedEx Express',
          rate: 21.99,
          currency: 'USD',
          delivery_days: 1,
          estimated_delivery_date: '2023-06-23',
          original_rate: 24.99
        },
        {
          id: 'rate_4',
          carrier: 'dhl',
          service: 'DHL Express',
          rate: 25.99,
          currency: 'USD',
          delivery_days: 2,
          estimated_delivery_date: '2023-06-24',
          original_rate: 29.99
        }
      ];
      
      // Set the full list of rates
      setAllRates(mockRates);
      setRates(mockRates);
      
      // Find best value rate (lowest price)
      const bestValue = mockRates.reduce((prev, current) => 
        prev.rate < current.rate ? prev : current
      );
      setBestValueRateId(bestValue.id);
      
      // Find fastest rate (lowest delivery days)
      const fastest = mockRates.reduce((prev, current) => 
        prev.delivery_days < current.delivery_days ? prev : current
      );
      setFastestRateId(fastest.id);
      
      // Extract unique carriers
      const carriers = [...new Set(mockRates.map(rate => rate.carrier))];
      setUniqueCarriers(carriers);
    };
    
    fetchRates();
  }, []);
  
  return {
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
    handleFilterByCarrier,
    resetShippingState
  };
}

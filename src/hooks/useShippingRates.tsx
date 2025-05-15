
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { carrierService, ShippingOption } from '@/services/CarrierService';
import { useShippingContext } from '@/contexts/ShippingContext';

export const useShippingRates = () => {
  const { shippingData } = useShippingContext();
  
  const [rates, setRates] = useState<ShippingOption[]>([]);
  const [allRates, setAllRates] = useState<ShippingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [labelUrl, setLabelUrl] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [shipmentId, setShipmentId] = useState('');
  const [bestValueRateId, setBestValueRateId] = useState('');
  const [fastestRateId, setFastestRateId] = useState('');
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState('all');
  
  // Fetch shipping rates when shippingData changes
  useEffect(() => {
    if (shippingData?.fromAddress && shippingData?.toAddress && shippingData?.parcel) {
      fetchShippingRates();
    }
  }, [shippingData]);
  
  // Fetch shipping rates from the API
  const fetchShippingRates = async () => {
    if (!shippingData?.fromAddress || !shippingData?.toAddress || !shippingData?.parcel) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call carrier service to get rates
      const fetchedRates = await carrierService.getShippingRates({
        fromAddress: shippingData.fromAddress,
        toAddress: shippingData.toAddress,
        parcel: shippingData.parcel,
        options: shippingData.options
      });
      
      // Save all rates
      setAllRates(fetchedRates);
      setRates(fetchedRates);
      
      // Find best value and fastest options
      if (fetchedRates.length > 0) {
        // Best value is the cheapest rate
        const bestValue = fetchedRates.reduce((prev, current) => 
          parseFloat(prev.rate) < parseFloat(current.rate) ? prev : current
        );
        
        // Fastest is the one with lowest delivery days
        const fastest = fetchedRates.reduce((prev, current) => {
          const prevDays = prev.delivery_days || 999;
          const currentDays = current.delivery_days || 999;
          return prevDays < currentDays ? prev : current;
        });
        
        setBestValueRateId(bestValue.id);
        setFastestRateId(fastest.id);
        
        // Automatically select the best value rate
        setSelectedRateId(bestValue.id);
        
        // Extract unique carriers
        const carriers = [...new Set(fetchedRates.map(rate => rate.carrier))];
        setUniqueCarriers(carriers);
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast.error('Failed to fetch shipping rates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle rate selection
  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
  };
  
  // Filter rates by carrier
  const handleFilterByCarrier = (carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      const filtered = allRates.filter(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
      setRates(filtered);
    }
  };
  
  // Create shipping label
  const handleCreateLabel = async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get the selected rate details
      const selectedRate = rates.find(rate => rate.id === selectedRateId);
      
      if (!selectedRate) {
        throw new Error('Selected rate not found');
      }
      
      const rate = selectedRate;
      const serviceType = rate.carrier.toLowerCase();
      
      // Extract shipment ID from the rate ID
      // Format is usually: [carrier]_[service]_[shipmentId]
      const idParts = rate.id.split('_');
      const extractedShipmentId = idParts.length > 2 ? idParts[2] : rate.shipment_id;
      
      if (!extractedShipmentId) {
        throw new Error('Shipment ID not found in rate');
      }
      
      // Determine if it's an international shipment
      const isInternational = 
        shippingData?.fromAddress?.country !== shippingData?.toAddress?.country;
      
      let result;
      
      if (isInternational) {
        // Use international label endpoint
        result = await carrierService.createInternationalLabel(
          extractedShipmentId, 
          selectedRateId,
          { format: 'PDF', size: '4x6' }
        );
      } else {
        // Use domestic label endpoint
        result = await carrierService.createLabel(
          extractedShipmentId,
          selectedRateId,
          serviceType as any
        );
      }
      
      // Set label data
      setLabelUrl(result.labelUrl);
      setTrackingCode(result.trackingCode);
      setShipmentId(result.shipmentId || extractedShipmentId);
      
      // Update UI to show label
      const event = new CustomEvent('shipping-step-change', {
        detail: { step: 'label' }
      });
      document.dispatchEvent(event);
      
      toast.success('Shipping label created successfully!');
      
    } catch (error) {
      console.error('Error creating shipping label:', error);
      toast.error('Failed to create shipping label. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle proceeding to payment
  const handleProceedToPayment = async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }
    
    setIsProcessingPayment(true);
    
    // In a real app, this would redirect to a payment gateway
    setTimeout(() => {
      toast.success('Payment processed successfully');
      handleCreateLabel();
      setIsProcessingPayment(false);
    }, 1500);
  };
  
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
    handleFilterByCarrier
  };
};

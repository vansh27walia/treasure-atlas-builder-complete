
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  delivery_days?: number;
  currency: string;
  original_rate?: number;
}

const DEFAULT_MARKUP_PERCENTAGE = 20;

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');
  const [bestValueRateId, setBestValueRateId] = useState<string | null>(null);
  const [fastestRateId, setFastestRateId] = useState<string | null>(null);

  useEffect(() => {
    const getStoredRates = async () => {
      try {
        // Get rates from session storage
        const storedRates = sessionStorage.getItem('shippingRates');
        const storedShipmentId = sessionStorage.getItem('shipmentId');
        
        if (storedRates) {
          const parsedRates = JSON.parse(storedRates);
          setAllRates(parsedRates);
          setRates(parsedRates);
          determineBestRates(parsedRates);
          
          if (storedShipmentId) {
            setShipmentId(storedShipmentId);
          }
        } else {
          // If no stored rates, call the API
          await fetchShippingRates();
        }
      } catch (error) {
        console.error('Error retrieving stored rates:', error);
      }
    };
    
    getStoredRates();
  }, []);
  
  // Determine the best value and fastest rates
  const determineBestRates = (rates: ShippingRate[]) => {
    if (rates.length === 0) return;
    
    // Best value is lowest rate
    const bestValue = [...rates].sort((a, b) => a.rate - b.rate)[0];
    setBestValueRateId(bestValue?.id);
    
    // Fastest is lowest delivery days
    const fastest = [...rates]
      .filter(rate => rate.delivery_days) // Only consider rates with defined delivery days
      .sort((a, b) => (a.delivery_days || 99) - (b.delivery_days || 99))[0];
    
    setFastestRateId(fastest?.id);
    
    // Pre-select best value if no rate is selected yet
    if (!selectedRateId && bestValue) {
      setSelectedRateId(bestValue.id);
    }
  };
  
  // Get unique carriers from all rates
  const uniqueCarriers = [...new Set(allRates.map(rate => rate.carrier.toLowerCase()))];
  
  // Filter rates by carrier
  const handleFilterByCarrier = (carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      const filteredRates = allRates.filter(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
      setRates(filteredRates);
      
      // If the currently selected rate is no longer visible, select the first filtered rate
      if (filteredRates.length > 0 && selectedRateId) {
        const isSelectedVisible = filteredRates.some(rate => rate.id === selectedRateId);
        if (!isSelectedVisible) {
          setSelectedRateId(filteredRates[0].id);
        }
      }
    }
  };
  
  const fetchShippingRates = async () => {
    setIsLoading(true);
    
    try {
      // Get the form data from session storage
      const fromAddressStr = sessionStorage.getItem('fromAddress');
      const toAddressStr = sessionStorage.getItem('toAddress');
      const parcelStr = sessionStorage.getItem('parcel');
      
      if (!fromAddressStr || !toAddressStr || !parcelStr) {
        toast.error('Missing shipping information. Please fill out the shipping form');
        setIsLoading(false);
        return;
      }
      
      const fromAddress = JSON.parse(fromAddressStr);
      const toAddress = JSON.parse(toAddressStr);
      const parcel = JSON.parse(parcelStr);
      
      // Call the backend function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress,
          toAddress,
          parcel,
          // Send the markup percentage to the API
          markupPercentage: DEFAULT_MARKUP_PERCENTAGE,
        }
      });
      
      if (error) {
        console.error('Error fetching shipping rates:', error);
        toast.error('Failed to fetch shipping rates');
        setIsLoading(false);
        return;
      }
      
      if (!data || !data.rates || !Array.isArray(data.rates) || data.rates.length === 0) {
        toast.error('No shipping rates available');
        setIsLoading(false);
        return;
      }
      
      // Store shipment ID for later use
      if (data.shipmentId) {
        setShipmentId(data.shipmentId);
        sessionStorage.setItem('shipmentId', data.shipmentId);
      }
      
      // Process and store the rates
      setAllRates(data.rates);
      setRates(data.rates);
      
      // Store rates in session storage
      sessionStorage.setItem('shippingRates', JSON.stringify(data.rates));
      
      // Identify best value and fastest shipping options
      determineBestRates(data.rates);
      
      toast.success('Shipping rates fetched successfully');
    } catch (error) {
      console.error('Error in fetchShippingRates:', error);
      toast.error('An error occurred while fetching shipping rates');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectRate = (rateId: string) => {
    setSelectedRateId(rateId);
    
    // Dispatch custom event for selected rate
    document.dispatchEvent(new CustomEvent('rate-selected'));
  };
  
  const handleCreateLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error('Please select a shipping rate');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the backend function to create a shipping label
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: {
          shipmentId,
          rateId: selectedRateId,
          options: {
            label_format: "PDF",
            label_size: "4x6"
          }
        }
      });
      
      if (error) {
        console.error('Error creating label:', error);
        toast.error('Failed to create shipping label');
        setIsLoading(false);
        return;
      }
      
      // Store the label URL and tracking code
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode);
      
      toast.success('Shipping label created successfully');
      
      // Clear stored shipping information after successful label creation
      // This prevents accidental re-submission
      /*
      sessionStorage.removeItem('fromAddress');
      sessionStorage.removeItem('toAddress');
      sessionStorage.removeItem('parcel');
      sessionStorage.removeItem('shippingRates');
      */
    } catch (error) {
      console.error('Error in handleCreateLabel:', error);
      toast.error('An error occurred while creating the shipping label');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProceedToPayment = () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate');
      return;
    }
    
    setIsProcessingPayment(true);
    
    // In a real application, this would redirect to a payment gateway
    toast.loading('Processing payment...');
    
    setTimeout(() => {
      toast.dismiss();
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

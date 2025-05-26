
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useNavigate } from 'react-router-dom';
import { GeneratedAddress } from '@/services/GeocodingService';

interface ParcelData {
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface RateRequestData {
  fromAddress: GeneratedAddress;
  toAddress: GeneratedAddress;
  parcel: ParcelData;
  carriers?: string[];
}

interface AIRecommendation {
  bestOverall: string | null;
  bestValue: string | null;
  fastest: string | null;
  mostReliable: string | null;
  analysisText: string;
}

const useRateCalculator = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { rates } = useShippingRates();

  // Function to fetch shipping rates with generated addresses
  const fetchRates = async (requestData: RateRequestData) => {
    setIsLoading(true);
    setAiRecommendation(null);
    
    try {
      console.log('Fetching rates with generated addresses:', requestData);
      
      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: requestData
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error("Failed to fetch shipping rates. Please try again.");
        return;
      }

      if (!data?.rates || data.rates.length === 0) {
        toast.warning("No shipping rates found for the provided details.");
        return;
      }

      console.log('Received rates:', data.rates);
      
      // Get rates and shipment ID
      const { rates, shipmentId } = data;
      
      // Store the calculator data for automatic transfer
      const calculatorData = {
        fromAddress: requestData.fromAddress,
        toAddress: requestData.toAddress,
        parcel: requestData.parcel,
        rates,
        shipmentId
      };
      
      // Store in sessionStorage for transfer to domestic shipping
      sessionStorage.setItem('calculatorData', JSON.stringify(calculatorData));
      
      // Dispatch a custom event to notify the ShippingRates component
      const ratesEvent = new CustomEvent('easypost-rates-received', {
        detail: { rates, shipmentId }
      });
      
      document.dispatchEvent(ratesEvent);
      
      // After rates are fetched, get AI recommendations
      if (rates.length > 0) {
        fetchAiRecommendations(rates);
      }
      
      toast.success(`Found ${rates.length} shipping options!`);
      
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast.error("An error occurred while calculating shipping rates.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get AI recommendations for the rates
  const fetchAiRecommendations = async (rates: any[]) => {
    if (rates.length === 0) return;
    
    setIsAiLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rates', {
        body: { rates }
      });
      
      if (error) {
        console.error('Error getting AI recommendations:', error);
        return;
      }
      
      if (data) {
        setAiRecommendation({
          bestOverall: data.bestOverallRateId || null,
          bestValue: data.bestValueRateId || null,
          fastest: data.fastestRateId || null,
          mostReliable: data.mostReliableRateId || null,
          analysisText: data.analysis || ''
        });
      }
    } catch (error) {
      console.error('Error in AI recommendation:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Function to navigate to shipping tab with selected rate and auto-fill data
  const selectRateAndProceed = (rateId: string) => {
    const rate = rates.find(r => r.id === rateId);
    if (!rate) {
      toast.error("Selected rate not found");
      return;
    }
    
    // Get calculator data from sessionStorage
    const calculatorDataStr = sessionStorage.getItem('calculatorData');
    if (calculatorDataStr) {
      const calculatorData = JSON.parse(calculatorDataStr);
      
      // Store selected rate and all data for auto-fill
      const transferData = {
        ...calculatorData,
        selectedRateId: rateId,
        selectedRate: rate
      };
      
      sessionStorage.setItem('transferToShipping', JSON.stringify(transferData));
    }
    
    // Navigate to domestic shipping tab
    navigate('/create-label?tab=domestic');
    
    // Dispatch event to auto-fill the shipping form
    setTimeout(() => {
      const transferEvent = new CustomEvent('auto-fill-shipping-form', {
        detail: { rateId, fromCalculator: true }
      });
      document.dispatchEvent(transferEvent);
    }, 500);
    
    toast.success("Proceeding to label creation with selected rate");
  };

  return {
    fetchRates,
    aiRecommendation,
    isLoading,
    isAiLoading,
    selectRateAndProceed
  };
};

export default useRateCalculator;

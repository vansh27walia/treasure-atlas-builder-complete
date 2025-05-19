
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/sonner';
import { useShippingRates } from '@/hooks/useShippingRates';
import { useNavigate } from 'react-router-dom';

interface AddressData {
  zip: string;
  country: string;
}

interface ParcelData {
  weight: number;
  length: number;
  width: number;
  height: number;
}

interface RateRequestData {
  fromAddress: AddressData;
  toAddress: AddressData;
  parcel: ParcelData;
  carriers?: string[]; // Add carriers option
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

  // Function to fetch shipping rates
  const fetchRates = async (requestData: RateRequestData) => {
    setIsLoading(true);
    setAiRecommendation(null);
    
    try {
      // Construct a more complete address data structure required by EasyPost
      const enhancedRequestData = {
        fromAddress: {
          ...requestData.fromAddress,
          name: "Rate Calculator Origin",
          street1: "Main Street", // EasyPost requires a street address even for rate calculations
          city: "City", // Generic placeholders that won't affect the rate calculation
          state: "State",
          phone: "555-555-5555"
        },
        toAddress: {
          ...requestData.toAddress,
          name: "Rate Calculator Destination",
          street1: "Destination Street", 
          city: "City",
          state: "State",
          phone: "555-555-5555"
        },
        parcel: requestData.parcel,
        // Ensure all carriers are requested if not specifically provided
        carriers: requestData.carriers && requestData.carriers.length > 0 
          ? requestData.carriers 
          : ['usps', 'ups', 'fedex', 'dhl']
      };

      // Check if international to use the right endpoint
      const isInternational = requestData.fromAddress.country !== requestData.toAddress.country;
      
      console.log('Fetching rates with data:', enhancedRequestData);
      
      // Call the Edge Function to get shipping rates
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: enhancedRequestData
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
      
      // Switch to the rates view after successful rate calculation
      const ratesSection = document.getElementById('shipping-rates-section');
      if (ratesSection) {
        ratesSection.scrollIntoView({ behavior: 'smooth' });
      }
      
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

  // Enhanced function to navigate to shipping tab with selected rate
  const selectRateAndProceed = (rateId: string) => {
    const rate = rates.find(r => r.id === rateId);
    if (!rate) {
      toast.error("Selected rate not found");
      return;
    }
    
    // Navigate to domestic shipping tab and select the rate
    navigate('/create-label?tab=domestic');
    
    // Wait for component to mount before selecting the rate
    setTimeout(() => {
      const customEvent = new CustomEvent('select-shipping-rate', {
        detail: { rateId }
      });
      document.dispatchEvent(customEvent);
      
      // Show success toast
      toast.success(`Selected "${rate.carrier.toUpperCase()} ${rate.service}"`);
    }, 300);
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

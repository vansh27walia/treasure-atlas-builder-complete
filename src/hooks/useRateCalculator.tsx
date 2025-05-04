
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/components/ui/use-toast';
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

interface OptionsData {
  packageType?: string;
  comments?: string;
  signatureRequired?: boolean;
  insurance?: boolean;
}

interface RateRequestData {
  fromAddress: AddressData;
  toAddress: AddressData;
  parcel: ParcelData;
  options?: OptionsData;
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
  const [rates, setRates] = useState<any[]>([]);

  // Function to fetch shipping rates
  const fetchRates = async (requestData: RateRequestData) => {
    setIsLoading(true);
    setAiRecommendation(null);
    
    try {
      // Simulate API call for now
      setTimeout(() => {
        // Dummy rates example
        const dummyRates = [
          {
            id: "rate_1",
            carrier: "USPS",
            service: "Priority Mail",
            rate: "12.40",
            currency: "USD",
            delivery_days: 2,
            delivery_date: "2025-05-06",
          },
          {
            id: "rate_2",
            carrier: "UPS",
            service: "Ground",
            rate: "14.50",
            currency: "USD",
            delivery_days: 3,
            delivery_date: "2025-05-07",
            list_rate: "16.75"
          }
        ];
        
        setRates(dummyRates);
        
        // Dispatch a custom event to notify the ShippingRates component
        const ratesEvent = new CustomEvent('easypost-rates-received', {
          detail: { rates: dummyRates, shipmentId: 'dummy-shipment-id' }
        });
        
        document.dispatchEvent(ratesEvent);
        setIsLoading(false);
        
        // Simulate AI recommendation
        setIsAiLoading(true);
        setTimeout(() => {
          setAiRecommendation({
            bestOverall: "rate_1",
            bestValue: "rate_1",
            fastest: "rate_1",
            mostReliable: "rate_2",
            analysisText: "Based on your package size and destination, USPS Priority Mail offers the best balance of speed and cost."
          });
          setIsAiLoading(false);
        }, 1500);
        
        toast({
          title: "Success",
          description: `Found ${dummyRates.length} shipping options!`,
        });
        
        // Scroll to the rates section
        const ratesSection = document.getElementById('shipping-rates-section');
        if (ratesSection) {
          ratesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error in rate calculation:', error);
      toast({
        title: "Error",
        description: "An error occurred while calculating shipping rates.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Function to navigate to shipping tab with selected rate
  const selectRateAndProceed = (rateId: string) => {
    const rate = rates.find(r => r.id === rateId);
    if (!rate) {
      toast({
        title: "Error",
        description: "Selected rate not found",
        variant: "destructive"
      });
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
      
      toast({
        title: "Success",
        description: "Rate selected! Now you can create your shipping label."
      });
    }, 300);
  };

  return {
    fetchRates,
    aiRecommendation,
    isLoading,
    isAiLoading,
    selectRateAndProceed,
    rates
  };
};

export default useRateCalculator;


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

interface LabelFormatOptions {
  label_format?: string;
  label_size?: string;
}

const useRateCalculator = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { rates } = useShippingRates();
  const [completedAddresses, setCompletedAddresses] = useState<{
    from: any;
    to: any;
  } | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);

  // Function to fetch shipping rates
  const fetchRates = async (requestData: RateRequestData) => {
    setIsLoading(true);
    setAiRecommendation(null);
    setCompletedAddresses(null);
    
    try {
      // Ensure carrier array is properly formatted
      const selectedCarriers = requestData.carriers && requestData.carriers.length > 0 
        ? requestData.carriers 
        : ['usps', 'ups', 'fedex', 'dhl'];
      
      console.log('Selected carriers for rate request:', selectedCarriers);
      
      // Send only the minimum required information - ZIP code and country
      // The edge function will handle address completion
      const enhancedRequestData = {
        fromAddress: {
          ...requestData.fromAddress,
          zip: requestData.fromAddress.zip,
          country: requestData.fromAddress.country || 'US'
        },
        toAddress: {
          ...requestData.toAddress,
          zip: requestData.toAddress.zip,
          country: requestData.toAddress.country || 'US'
        },
        parcel: requestData.parcel,
        // Make sure we're passing the selected carriers explicitly
        carriers: selectedCarriers
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
      console.log('Carriers in returned rates:', [...new Set(data.rates.map(rate => rate.carrier))].join(', '));
      
      // Store the completed addresses for display if needed
      if (data.completedAddresses) {
        setCompletedAddresses(data.completedAddresses);
        console.log('Completed addresses:', data.completedAddresses);
      }
      
      // Get rates and shipment ID
      const { rates, shipmentId } = data;
      setActiveShipmentId(shipmentId);
      
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

  // Function to create a shipping label
  const createShippingLabel = async (rateId: string, shipmentId: string, options: LabelFormatOptions = {}) => {
    try {
      setIsLoading(true);
      
      // Call the Edge Function to create a label
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { 
          rateId, 
          shipmentId,
          options: {
            label_format: options.label_format || "PDF",
            label_size: options.label_size || "4x6"
          }
        }
      });
      
      if (error) {
        throw new Error(`Error creating label: ${error.message}`);
      }
      
      if (!data?.labelUrl) {
        throw new Error("No label URL received");
      }
      
      // Store the label information in state
      setLabelUrl(data.labelUrl);
      setTrackingCode(data.trackingCode || 'N/A');
      
      // Return label data
      return {
        labelUrl: data.labelUrl,
        trackingCode: data.trackingCode || 'N/A'
      };
      
    } catch (error) {
      console.error('Error creating label:', error);
      throw error;
    } finally {
      setIsLoading(false);
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

  // Function to update label format
  const updateLabelFormat = async (format: string): Promise<void> => {
    if (!activeShipmentId || !rates || rates.length === 0) {
      toast.error("No active shipment available");
      return Promise.reject("No active shipment");
    }
    
    // Find the selected rate ID
    const selectedRateId = document.querySelector('[data-selected="true"]')?.getAttribute('data-rate-id');
    
    if (!selectedRateId) {
      toast.error("Please select a shipping rate first");
      return Promise.reject("No rate selected");
    }
    
    try {
      // Generate a new label with the updated format
      const result = await createShippingLabel(selectedRateId, activeShipmentId, {
        label_format: "PDF",
        label_size: format
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating label format:", error);
      return Promise.reject(error);
    }
  };

  return {
    fetchRates,
    aiRecommendation,
    isLoading,
    isAiLoading,
    selectRateAndProceed,
    createShippingLabel,
    completedAddresses,
    labelUrl,
    trackingCode,
    shipmentId: activeShipmentId,
    updateLabelFormat
  };
};

export default useRateCalculator;

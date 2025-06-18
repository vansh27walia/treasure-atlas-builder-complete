
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Address {
  name?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  phone?: string;
  company?: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days: number;
  delivery_date: string;
  delivery_date_guaranteed: boolean;
  est_delivery_days: number;
  shipment_id: string;
  carrier_account_id: string;
  list_rate?: string;
  retail_rate?: string;
  original_rate?: string;
}

interface RateRequest {
  fromAddress: Address;
  toAddress: Address;
  parcel: Parcel;
  options?: Record<string, any>;
}

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [allRates, setAllRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [uniqueCarriers, setUniqueCarriers] = useState<string[]>([]);
  const [activeCarrierFilter, setActiveCarrierFilter] = useState<string>('all');

  // Calculate best value and fastest rates
  const bestValueRateId = rates.length > 0 
    ? rates.reduce((prev, current) => 
        parseFloat(prev.rate) < parseFloat(current.rate) ? prev : current
      ).id 
    : null;

  const fastestRateId = rates.length > 0
    ? rates.reduce((prev, current) => 
        (prev.delivery_days || 999) < (current.delivery_days || 999) ? prev : current
      ).id
    : null;

  const fetchRates = useCallback(async (rateRequest: RateRequest) => {
    setIsLoading(true);
    setError(null);
    setRates([]);

    try {
      console.log('Fetching rates with request:', rateRequest);

      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: rateRequest
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch shipping rates');
      }

      console.log('Rates fetched successfully:', data.rates);
      const formattedRates = data.rates.map((rate: any) => ({
        ...rate,
        rate: rate.rate.toString(),
        original_rate: rate.rate.toString()
      }));
      
      setRates(formattedRates || []);
      setAllRates(formattedRates || []);
      setShipmentId(data.shipment_id);
      
      // Extract unique carriers
      const carriers = [...new Set(formattedRates.map((rate: ShippingRate) => rate.carrier))] as string[];
      setUniqueCarriers(carriers);
      
      if (formattedRates && formattedRates.length > 0) {
        toast.success(`Found ${formattedRates.length} shipping rates`);
      } else {
        toast.warning('No shipping rates available for this shipment');
      }

    } catch (error) {
      console.error('Error fetching rates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shipping rates';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectRate = useCallback((rateId: string) => {
    setSelectedRateId(rateId);
    
    // Dispatch rate selected event
    const event = new CustomEvent('rate-selected', {
      detail: { rateId }
    });
    document.dispatchEvent(event);
  }, []);

  const handleFilterByCarrier = useCallback((carrier: string) => {
    setActiveCarrierFilter(carrier);
    
    if (carrier === 'all') {
      setRates(allRates);
    } else {
      const filteredRates = allRates.filter(rate => 
        rate.carrier.toLowerCase() === carrier.toLowerCase()
      );
      setRates(filteredRates);
    }
  }, [allRates]);

  const handleProceedToPayment = useCallback(async () => {
    if (!selectedRateId) {
      toast.error('Please select a shipping rate first');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Payment processed successfully');
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [selectedRateId]);

  const saveShipmentToDatabase = useCallback(async (shipmentData: any) => {
    try {
      console.log('Saving shipment to database:', shipmentData);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Format recipient address
      const recipientAddress = shipmentData.toAddress ? 
        `${shipmentData.toAddress.street1 || ''} ${shipmentData.toAddress.street2 || ''}, ${shipmentData.toAddress.city || ''}, ${shipmentData.toAddress.state || ''} ${shipmentData.toAddress.zip || ''}`.trim() : 
        'Unknown';

      // Check if shipment already exists
      const { data: existingShipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('tracking_code', shipmentData.trackingCode)
        .eq('user_id', user.id)
        .single();

      if (existingShipment) {
        console.log('Shipment already exists, updating...');
        
        // Update existing shipment
        const { error: updateError } = await supabase
          .from('shipments')
          .update({
            label_url: shipmentData.labelUrl,
            status: 'created',
            recipient_name: shipmentData.toAddress?.name || 'Unknown',
            recipient_address: recipientAddress,
            service: shipmentData.service,
            updated_at: new Date().toISOString()
          })
          .eq('tracking_code', shipmentData.trackingCode)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating shipment:', updateError);
          throw updateError;
        }
      } else {
        // Insert new shipment record
        const { error: insertError } = await supabase
          .from('shipments')
          .insert([{
            user_id: user.id,
            tracking_code: shipmentData.trackingCode,
            carrier: shipmentData.carrier,
            shipment_id: shipmentData.shipmentId || '',
            label_url: shipmentData.labelUrl,
            service: shipmentData.service,
            status: 'created',
            recipient_name: shipmentData.toAddress?.name || 'Unknown',
            recipient_address: recipientAddress,
            package_details: {
              weight: shipmentData.parcel?.weight ? `${shipmentData.parcel.weight} oz` : 'Unknown',
              dimensions: shipmentData.parcel ? 
                `${shipmentData.parcel.length || 0}x${shipmentData.parcel.width || 0}x${shipmentData.parcel.height || 0} in` : 
                'Unknown',
              service: shipmentData.service || 'Standard'
            },
            tracking_history: {
              events: [],
              created_at: new Date().toISOString()
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error inserting shipment:', insertError);
          throw insertError;
        }
      }

      console.log('Shipment saved successfully to database');
      return true;
    } catch (error) {
      console.error('Error saving shipment to database:', error);
      toast.error('Failed to save shipment tracking information');
      return false;
    }
  }, []);

  const handleCreateLabel = useCallback(async (rateId?: string, shipmentIdParam?: string, options?: any, shipmentDetails?: any) => {
    const finalRateId = rateId || selectedRateId;
    const finalShipmentId = shipmentIdParam || shipmentId;
    
    if (!finalRateId || !finalShipmentId) {
      throw new Error('Missing rate ID or shipment ID');
    }

    setIsLoading(true);
    
    try {
      console.log('Creating label with rate:', finalRateId, 'shipment:', finalShipmentId);
      
      // Call the create-label function
      const { data, error } = await supabase.functions.invoke('create-label', {
        body: { 
          shipmentId: finalShipmentId, 
          rateId: finalRateId,
          options: options || {}
        }
      });

      if (error) {
        console.error('Create label error:', error);
        throw new Error(error.message);
      }

      if (data && data.labelUrl && data.trackingCode) {
        setLabelUrl(data.labelUrl);
        setTrackingCode(data.trackingCode);
        
        // Get the selected rate details
        const selectedRate = rates.find(rate => rate.id === finalRateId);
        
        // Save shipment to database for tracking
        await saveShipmentToDatabase({
          trackingCode: data.trackingCode,
          carrier: selectedRate?.carrier || 'Unknown',
          shipmentId: finalShipmentId,
          labelUrl: data.labelUrl,
          service: selectedRate?.service,
          toAddress: shipmentDetails?.toAddress,
          parcel: shipmentDetails?.parcel
        });
        
        // Update step to label
        const stepEvent = new CustomEvent('shipping-step-change', {
          detail: { step: 'label' }
        });
        document.dispatchEvent(stepEvent);
        
        toast.success('Label created successfully!');
        return data;
      } else {
        throw new Error('Invalid response from label creation');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRateId, shipmentId, rates, saveShipmentToDatabase]);

  const clearRates = useCallback(() => {
    setRates([]);
    setAllRates([]);
    setError(null);
    setShipmentId(null);
    setSelectedRateId(null);
    setLabelUrl(null);
    setTrackingCode(null);
    setUniqueCarriers([]);
    setActiveCarrierFilter('all');
  }, []);

  return {
    rates,
    allRates,
    selectedRateId,
    isLoading,
    isProcessingPayment,
    error,
    shipmentId,
    labelUrl,
    trackingCode,
    bestValueRateId,
    fastestRateId,
    uniqueCarriers,
    activeCarrierFilter,
    fetchRates,
    handleSelectRate,
    handleFilterByCarrier,
    handleProceedToPayment,
    handleCreateLabel,
    clearRates
  };
};

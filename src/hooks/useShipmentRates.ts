
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner'; // Corrected from 'sonner'
import { BulkUploadResult, BulkShipment, Rate, SavedAddress } from '@/types/shipping';

export const useShipmentRates = (
  results: BulkUploadResult | null,
  updateResults: (
    newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)
  ) => void,
  pickupAddressProp?: SavedAddress | null // Ensure this is string ID
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchAllShipmentRates = useCallback(async (shipmentsToFetchRatesFor?: BulkShipment[], localPickupAddress?: SavedAddress | null) => {
    const currentPickupAddress = localPickupAddress || pickupAddressProp;

    if (!results || (!shipmentsToFetchRatesFor && !results.processedShipments) || !currentPickupAddress) {
      toast.error('Cannot fetch rates: missing shipment data or pickup address.');
      return;
    }
    
    // Ensure currentPickupAddress has string ID if it's being stringified or sent to backend expecting string
    const validPickupAddress = currentPickupAddress && currentPickupAddress.id 
      ? { ...currentPickupAddress, id: String(currentPickupAddress.id) } 
      : null;

    if (!validPickupAddress) {
        toast.error('Pickup address is invalid or missing ID.');
        return;
    }

    const shipmentsForApi = (shipmentsToFetchRatesFor || results.processedShipments)
      .filter(s => s.status === 'pending_rates' || !s.availableRates || s.availableRates.length === 0)
      .map(s => ({
        shipment_id_internal: String(s.id), // Ensure string ID
        to_address: s.details.to_address,
        parcel: s.details.parcel,
        options: s.details.options,
        customs_info: s.details.customs_info,
        // from_address logic might need to be handled by backend using pickupAddressId
        // or explicitly pass from_address derived from validPickupAddress
        from_address: s.details.from_address || {
              name: validPickupAddress.name || '',
              company: validPickupAddress.company || '',
              street1: validPickupAddress.street1 || '',
              street2: validPickupAddress.street2 || '',
              city: validPickupAddress.city || '',
              state: validPickupAddress.state || '',
              zip: validPickupAddress.zip || '',
              country: validPickupAddress.country || 'US', // Default country
              phone: validPickupAddress.phone || '',
              email: validPickupAddress.email || '',
              is_residential: validPickupAddress.address_type === 'residential'
            },
      }));


    if (shipmentsForApi.length === 0) {
      toast.info('All shipments already have rates or are not pending rates.');
      return;
    }
    
    setIsFetchingRates(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-bulk-shipment-rates', {
        body: { 
          shipments: shipmentsForApi,
          // pickup_address_id: validPickupAddress.id // Pass ID if backend fetches details
        },
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error(`Failed to fetch rates: ${error.message}`);
        // Mark shipments as error
        const erroredShipments = results.processedShipments.map(shipment => 
            shipmentsForApi.find(sApi => sApi.shipment_id_internal === shipment.id) 
            ? { ...shipment, status: 'error' as const, error: `Rate fetch failed: ${error.message}` } 
            : shipment
        );
        updateResults({ processedShipments: erroredShipments });
        return;
      }

      if (!data || !data.shipments) {
        console.error('No shipments data received from rate fetching');
        toast.error('No shipment rate data received.');
        // Mark shipments as error if no data
        const erroredShipments = results.processedShipments.map(shipment => 
            shipmentsForApi.find(sApi => sApi.shipment_id_internal === shipment.id) 
            ? { ...shipment, status: 'error' as const, error: 'No rate data received' } 
            : shipment
        );
        updateResults({ processedShipments: erroredShipments });
        return;
      }

      const updatedShipments = results.processedShipments.map(shipment => {
        const apiShipment = data.shipments.find((s: any) => s.shipment_id_internal === String(shipment.id));
        if (apiShipment && apiShipment.rates && apiShipment.rates.length > 0) {
          const rates: Rate[] = apiShipment.rates.map((rate: any) => ({
            id: String(rate.id), // Ensure string ID
            easypost_rate_id: String(rate.id),
            carrier: rate.carrier,
            service: rate.service,
            rate: parseFloat(rate.rate), // Rate is number
            formattedRate: String(rate.rate), // Keep formatted string if needed
            delivery_days: rate.delivery_days,
            est_delivery_days: rate.est_delivery_days,
            shipment_id: String(rate.shipment_id), // Ensure string ID
            carrier_account_id: String(rate.carrier_account_id),
            retail_rate: rate.retail_rate ? String(rate.retail_rate) : undefined,
            list_rate: rate.list_rate ? String(rate.list_rate) : undefined,
          }));
          return { ...shipment, availableRates: rates, status: 'rates_fetched' as const, error: null };
        } else if (apiShipment && (!apiShipment.rates || apiShipment.rates.length === 0)) {
            return { ...shipment, status: 'error' as const, error: apiShipment.error || 'No rates returned for this shipment.', availableRates: [] };
        }
        return shipment;
      });

      updateResults({
        processedShipments: updatedShipments,
      });

    } catch (e: any) {
      console.error('Error during bulk shipment rate fetching:', e);
      toast.error(`Rate fetching failed: ${e.message}`);
       const erroredShipments = results.processedShipments.map(shipment => 
            shipmentsForApi.find(sApi => sApi.shipment_id_internal === shipment.id) 
            ? { ...shipment, status: 'error' as const, error: `Rate fetch failed: ${e.message}` } 
            : shipment
        );
        updateResults({ processedShipments: erroredShipments });
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, updateResults, pickupAddressProp, supabase.functions]);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (String(shipment.id) === shipmentId) { // Ensure comparison with string ID
        const selectedRate = shipment.availableRates?.find(rate => String(rate.id) === rateId);
        if (selectedRate) {
          return {
            ...shipment,
            selectedRateId: String(rateId), // Ensure string ID
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            rate: selectedRate.rate, // rate is already a number
            status: 'rate_selected' as const,
          };
        }
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      // shipment.rate should be populated if a rate is selected
      return sum + (shipment.rate || 0); 
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      totalCost // totalCost is number
    });
  }, [updateResults, results]);

  const handleRefreshRates = useCallback(async (shipmentId: string, localPickupAddress?: SavedAddress | null) => {
    const currentPickupAddress = localPickupAddress || pickupAddressProp;
    if (!results || !currentPickupAddress) {
      toast.error('Missing shipment data or pickup address.');
      return;
    }
    
    const validPickupAddress = currentPickupAddress && currentPickupAddress.id 
      ? { ...currentPickupAddress, id: String(currentPickupAddress.id) } 
      : null;

    if (!validPickupAddress) {
        toast.error('Pickup address is invalid or missing ID for refreshing rates.');
        return;
    }

    const shipment = results.processedShipments.find(s => String(s.id) === shipmentId);
    if (!shipment) {
      toast.error('Shipment not found.');
      return;
    }

    if (!shipment.details) {
      toast.error('Shipment details are missing.');
      return;
    }

    setIsFetchingRates(true);
    try {
       const shipmentDetailsForApi = {
        ...shipment.details,
        // Ensure from_address is consistent or backend uses pickupAddressId
         from_address: shipment.details.from_address || {
              name: validPickupAddress.name || '',
              company: validPickupAddress.company || '',
              street1: validPickupAddress.street1 || '',
              street2: validPickupAddress.street2 || '',
              city: validPickupAddress.city || '',
              state: validPickupAddress.state || '',
              zip: validPickupAddress.zip || '',
              country: validPickupAddress.country || 'US',
              phone: validPickupAddress.phone || '',
              email: validPickupAddress.email || '',
              is_residential: validPickupAddress.address_type === 'residential'
            },
      };

      const { data, error } = await supabase.functions.invoke('get-shipment-rates', { // This function might be for single shipment
        body: { 
          shipmentDetails: shipmentDetailsForApi,
          // pickup_address_id: validPickupAddress.id // If backend expects ID
        },
      });

      if (error) {
        console.error('Error refreshing rates:', error);
        toast.error(`Failed to refresh rates for ${shipmentId}: ${error.message}`);
        updateResults(prev => ({
            ...prev,
            processedShipments: prev!.processedShipments.map(s => s.id === shipmentId ? {...s, status: 'error' as const, error: `Rate refresh failed: ${error.message}`} : s)
        }));
        return;
      }

      if (!data || !data.rates) {
        console.error('No rates data received from rate refreshing for', shipmentId);
        toast.error(`No rates data received for ${shipmentId}.`);
         updateResults(prev => ({
            ...prev,
            processedShipments: prev!.processedShipments.map(s => s.id === shipmentId ? {...s, status: 'error' as const, error: 'No rate data received', availableRates: []} : s)
        }));
        return;
      }

      const rates: Rate[] = data.rates.map((rate: any) => ({
        id: String(rate.id),
        easypost_rate_id: String(rate.id),
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate), // rate is number
        formattedRate: String(rate.rate),
        delivery_days: rate.delivery_days,
        est_delivery_days: rate.est_delivery_days,
        shipment_id: String(rate.shipment_id),
        carrier_account_id: String(rate.carrier_account_id),
        retail_rate: rate.retail_rate ? String(rate.retail_rate) : undefined,
        list_rate: rate.list_rate ? String(rate.list_rate) : undefined,
      }));

      const updatedShipments = results.processedShipments.map(s =>
        String(s.id) === shipmentId ? { ...s, availableRates: rates, status: 'rates_fetched' as const, error: null, selectedRateId: null, rate: undefined } : s
      );
      // Recalculate total cost
      const totalCost = updatedShipments.reduce((sum, s) => sum + (s.rate || 0), 0);
      updateResults({ processedShipments: updatedShipments, totalCost });
      toast.success(`Rates refreshed for shipment ${shipmentId}`);

    } catch (e: any) {
      console.error('Error during shipment rate refreshing:', e);
      toast.error(`Rate refresh failed for ${shipmentId}: ${e.message}`);
      updateResults(prev => ({
            ...prev,
            processedShipments: prev!.processedShipments.map(s => s.id === shipmentId ? {...s, status: 'error' as const, error: `Rate refresh failed: ${e.message}`} : s)
        }));
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, updateResults, pickupAddressProp, supabase.functions]);

  const handleBulkApplyCarrier = useCallback((carrierId: string, serviceLevel?: string) => { // Service level is optional
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (!shipment.availableRates || shipment.availableRates.length === 0) return shipment;

      // Find rates for the specified carrier
      let candidateRates = shipment.availableRates.filter(rate => rate.carrier === carrierId);
      
      // If serviceLevel is specified, further filter by it (exact match or a broader category if implemented)
      if (serviceLevel) {
          // This assumes serviceLevel is an exact match to rate.service. 
          // For more complex matching (e.g. "ground" matching "UPS Ground"), more logic would be needed.
          const serviceFilteredRates = candidateRates.filter(rate => rate.service.toLowerCase().includes(serviceLevel.toLowerCase()));
          if (serviceFilteredRates.length > 0) {
              candidateRates = serviceFilteredRates;
          }
      }

      // Select the cheapest rate among candidates
      if (candidateRates.length > 0) {
        const cheapestRate = candidateRates.reduce((prev, current) => (prev.rate < current.rate ? prev : current));
        return {
          ...shipment,
          selectedRateId: String(cheapestRate.id),
          carrier: cheapestRate.carrier,
          service: cheapestRate.service,
          rate: cheapestRate.rate, // rate is already number
          status: 'rate_selected' as const,
        };
      }
      return shipment; // No matching rate found, keep as is
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      totalCost // totalCost is number
    });
    toast.success(`Applied ${carrierId} ${serviceLevel || ''} to eligible shipments.`);
  }, [results, updateResults]);

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier,
  };
};

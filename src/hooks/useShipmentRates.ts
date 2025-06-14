import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment, Rate, SavedAddress } from '@/types/shipping';

export const useShipmentRates = (
  results: BulkUploadResult | null,
  updateResults: (
    newResultsData: Partial<BulkUploadResult> | ((prevResults: BulkUploadResult | null) => BulkUploadResult | null)
  ) => void,
  pickupAddressProp?: SavedAddress | null
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchAllShipmentRates = useCallback(async (shipmentsToFetchRatesFor?: BulkShipment[], localPickupAddress?: SavedAddress | null) => {
    const currentPickupAddress = localPickupAddress || pickupAddressProp;

    if (!results || (!shipmentsToFetchRatesFor && !results.processedShipments) || !currentPickupAddress) {
      toast.error('Cannot fetch rates: missing shipment data or pickup address.');
      return;
    }

    const shipmentsForApi = (shipmentsToFetchRatesFor || results.processedShipments)
      .filter(s => s.status === 'pending_rates' || !s.availableRates || s.availableRates.length === 0)
      .map(s => ({
        shipment_id_internal: s.id,
        to_address: s.details.to_address,
        parcel: s.details.parcel,
        options: s.details.options,
        customs_info: s.details.customs_info,
        from_address: s.details.from_address || currentPickupAddress
          ? {
              name: currentPickupAddress?.name || '',
              company: currentPickupAddress?.company || '',
              street1: currentPickupAddress?.street1 || '',
              street2: currentPickupAddress?.street2 || '',
              city: currentPickupAddress?.city || '',
              state: currentPickupAddress?.state || '',
              zip: currentPickupAddress?.zip || '',
              country: currentPickupAddress?.country || 'US',
              phone: currentPickupAddress?.phone || '',
              email: currentPickupAddress?.email || '',
            }
          : undefined,
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
        },
      });

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error(`Failed to fetch rates: ${error.message}`);
        return;
      }

      if (!data || !data.shipments) {
        console.error('No shipments data received from rate fetching');
        toast.error('No shipment rate data received.');
        return;
      }

      const updatedShipments = results.processedShipments.map(shipment => {
        const apiShipment = data.shipments.find((s: any) => s.shipment_id_internal === shipment.id);
        if (apiShipment && apiShipment.rates) {
          const rates: Rate[] = apiShipment.rates.map((rate: any) => ({
            id: rate.id,
            easypost_rate_id: rate.id,
            carrier: rate.carrier,
            service: rate.service,
            rate: parseFloat(rate.rate),
            formattedRate: rate.rate,
            delivery_days: rate.delivery_days,
            est_delivery_days: rate.est_delivery_days,
            shipment_id: rate.shipment_id,
            carrier_account_id: rate.carrier_account_id,
            retail_rate: rate.retail_rate,
            list_rate: rate.list_rate,
          }));
          return { ...shipment, availableRates: rates, status: 'rates_fetched' as const };
        }
        return shipment;
      });

      updateResults({
        processedShipments: updatedShipments,
      });

    } catch (e: any) {
      console.error('Error during bulk shipment rate fetching:', e);
      toast.error(`Rate fetching failed: ${e.message}`);
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, updateResults, pickupAddressProp]);

  const handleSelectRate = useCallback((shipmentId: string, rateId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        if (selectedRate) {
          return {
            ...shipment,
            selectedRateId: rateId,
            carrier: selectedRate.carrier,
            service: selectedRate.service,
            rate: parseFloat(selectedRate.rate)
          };
        }
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      totalCost
    });
  }, [updateResults, results]);

  const handleRefreshRates = useCallback(async (shipmentId: string, localPickupAddress?: SavedAddress | null) => {
    const currentPickupAddress = localPickupAddress || pickupAddressProp;
    if (!results || !currentPickupAddress) {
      toast.error('Missing shipment data or pickup address.');
      return;
    }

    const shipment = results.processedShipments.find(s => s.id === shipmentId);
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
      const { data, error } = await supabase.functions.invoke('get-shipment-rates', {
        body: { 
          shipmentDetails: shipment.details, 
          pickupAddress: currentPickupAddress 
        },
      });

      if (error) {
        console.error('Error refreshing rates:', error);
        toast.error(`Failed to refresh rates: ${error.message}`);
        return;
      }

      if (!data || !data.rates) {
        console.error('No rates data received from rate refreshing');
        toast.error('No rates data received.');
        return;
      }

      const rates: Rate[] = data.rates.map((rate: any) => ({
        id: rate.id,
        easypost_rate_id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: parseFloat(rate.rate),
        formattedRate: rate.rate,
        delivery_days: rate.delivery_days,
        est_delivery_days: rate.est_delivery_days,
        shipment_id: rate.shipment_id,
        carrier_account_id: rate.carrier_account_id,
        retail_rate: rate.retail_rate,
        list_rate: rate.list_rate,
      }));

      const updatedShipments = results.processedShipments.map(s =>
        s.id === shipmentId ? { ...s, availableRates: rates, status: 'rates_fetched' as const } : s
      );

      updateResults({ processedShipments: updatedShipments });

    } catch (e: any) {
      console.error('Error during shipment rate refreshing:', e);
      toast.error(`Rate refresh failed: ${e.message}`);
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, updateResults, pickupAddressProp]);

  const handleBulkApplyCarrier = useCallback((carrierId: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      const carrierRate = shipment.availableRates?.find(rate => rate.carrier === carrierId);
      if (carrierRate) {
        return {
          ...shipment,
          selectedRateId: carrierRate.id,
          carrier: carrierRate.carrier,
          service: carrierRate.service,
          rate: parseFloat(carrierRate.rate)
        };
      }
      return shipment;
    });
    
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate ? parseFloat(selectedRate.rate) : 0);
    }, 0);
    
    updateResults({
      processedShipments: updatedShipments,
      totalCost
    });
  }, [results, updateResults]);

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier,
  };
};

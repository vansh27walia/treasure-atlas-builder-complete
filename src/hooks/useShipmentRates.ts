
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

export const useShipmentRates = (
  results: BulkUploadResult | null, 
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  // Apply 5% markup to rates
  const applyRateMarkup = (rate: number) => {
    const markup = 0.05; // 5% markup
    return Math.round((rate * (1 + markup)) * 100) / 100;
  };

  const fetchAllShipmentRates = async (shipments: BulkShipment[]) => {
    if (!results) return;
    
    setIsFetchingRates(true);
    
    try {
      console.log('Fetching live rates for shipments...');
      
      const updatedShipments = [...shipments];
      
      // Process shipments in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < updatedShipments.length; i += batchSize) {
        const batch = updatedShipments.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (shipment, index) => {
          try {
            // If rates already exist, skip
            if (shipment.availableRates && shipment.availableRates.length > 0) {
              return;
            }
            
            // Fetch rates via edge function
            const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
              body: {
                fromAddress: results.pickupAddress,
                toAddress: {
                  name: shipment.details?.name,
                  company: shipment.details?.company,
                  street1: shipment.details?.street1,
                  street2: shipment.details?.street2,
                  city: shipment.details?.city,
                  state: shipment.details?.state,
                  zip: shipment.details?.zip,
                  country: shipment.details?.country,
                  phone: shipment.details?.phone,
                },
                parcel: {
                  length: shipment.details?.parcel_length || 8,
                  width: shipment.details?.parcel_width || 6,
                  height: shipment.details?.parcel_height || 4,
                  weight: shipment.details?.parcel_weight || 16,
                }
              }
            });
            
            if (error) {
              console.error('Error fetching rates for shipment:', error);
              return;
            }
            
            if (data && data.rates) {
              // Apply 5% markup to all rates
              const ratesWithMarkup = data.rates.map(rate => ({
                ...rate,
                original_rate: rate.rate,
                rate: applyRateMarkup(parseFloat(rate.rate)).toString()
              }));

              const actualIndex = i + index;
              updatedShipments[actualIndex] = {
                ...shipment,
                availableRates: ratesWithMarkup,
                selectedRateId: ratesWithMarkup[0]?.id,
                carrier: ratesWithMarkup[0]?.carrier || shipment.carrier,
                service: ratesWithMarkup[0]?.service || shipment.service,
                rate: parseFloat(ratesWithMarkup[0]?.rate) || shipment.rate,
              };
            }
            
          } catch (error) {
            console.error('Error processing shipment rates:', error);
          }
        }));
        
        // Small delay between batches
        if (i + batchSize < updatedShipments.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Calculate new total cost
      const newTotalCost = updatedShipments.reduce((total, shipment) => {
        return total + (shipment.rate || 0);
      }, 0);
      
      updateResults({
        ...results,
        processedShipments: updatedShipments,
        totalCost: newTotalCost,
      });
      
      console.log('Live rates fetched successfully with 5% markup applied');
      toast.success('Live shipping rates updated with 5% markup');
      
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      toast.error('Failed to fetch live rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleSelectRate = (shipmentId: string, rateId: string) => {
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
            rate: parseFloat(selectedRate.rate.toString()),
          };
        }
      }
      return shipment;
    });
    
    // Calculate new total cost
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + (shipment.rate || 0);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
  };

  const handleRefreshRates = async (shipmentId: string) => {
    if (!results) return;
    
    setIsFetchingRates(true);
    
    try {
      const shipment = results.processedShipments.find(s => s.id === shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: results.pickupAddress,
          toAddress: {
            name: shipment.details?.name,
            company: shipment.details?.company,
            street1: shipment.details?.street1,
            street2: shipment.details?.street2,
            city: shipment.details?.city,
            state: shipment.details?.state,
            zip: shipment.details?.zip,
            country: shipment.details?.country,
            phone: shipment.details?.phone,
          },
          parcel: {
            length: shipment.details?.parcel_length || 8,
            width: shipment.details?.parcel_width || 6,
            height: shipment.details?.parcel_height || 4,
            weight: shipment.details?.parcel_weight || 16,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.rates) {
        // Apply 5% markup to all rates
        const ratesWithMarkup = data.rates.map(rate => ({
          ...rate,
          original_rate: rate.rate,
          rate: applyRateMarkup(parseFloat(rate.rate)).toString()
        }));

        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s,
              availableRates: ratesWithMarkup,
              selectedRateId: ratesWithMarkup[0]?.id,
              carrier: ratesWithMarkup[0]?.carrier || s.carrier,
              service: ratesWithMarkup[0]?.service || s.service,
              rate: parseFloat(ratesWithMarkup[0]?.rate.toString()) || s.rate,
            };
          }
          return s;
        });
        
        const newTotalCost = updatedShipments.reduce((total, s) => {
          return total + (s.rate || 0);
        }, 0);
        
        updateResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: newTotalCost,
        });
        
        toast.success('Rates refreshed successfully with 5% markup');
      }
      
    } catch (error) {
      console.error('Error refreshing rates:', error);
      toast.error('Failed to refresh rates');
    } finally {
      setIsFetchingRates(false);
    }
  };

  const handleBulkApplyCarrier = (carrierName: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      const carrierRate = shipment.availableRates?.find(rate => 
        rate.carrier.toLowerCase() === carrierName.toLowerCase()
      );
      
      if (carrierRate) {
        return {
          ...shipment,
          selectedRateId: carrierRate.id,
          carrier: carrierRate.carrier,
          service: carrierRate.service,
          rate: parseFloat(carrierRate.rate.toString()),
        };
      }
      
      return shipment;
    });
    
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      return total + (shipment.rate || 0);
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success(`Applied ${carrierName} to all eligible shipments with 5% markup`);
  };

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier,
  };
};

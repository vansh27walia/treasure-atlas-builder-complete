
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';
import { standardizeCarrierName, standardizeServiceName } from '@/utils/carrierUtils';

// 🎛️ CONFIGURABLE MARKUP PERCENTAGE - Change this value to adjust profit margin
const RATE_MARKUP_PERCENTAGE = 5; // 5% markup - You can change this to 6, 7, 10, etc.

// Apply configurable markup to rates
const applyRateMarkup = (originalRate: number): number => {
  const markupAmount = originalRate * (RATE_MARKUP_PERCENTAGE / 100);
  const finalRate = originalRate + markupAmount;
  
  console.log(`Bulk rate markup applied: Original: $${originalRate.toFixed(2)}, Markup (${RATE_MARKUP_PERCENTAGE}%): $${markupAmount.toFixed(2)}, Final: $${finalRate.toFixed(2)}`);
  
  return finalRate;
};

export const useShipmentRates = (
  results: BulkUploadResult | null, 
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchAllShipmentRates = async (shipments: BulkShipment[]) => {
    if (!results) return;
    
    setIsFetchingRates(true);
    
    try {
      console.log(`Fetching live rates for shipments with ${RATE_MARKUP_PERCENTAGE}% markup...`);
      
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
                  name: shipment.details?.to_address?.name || shipment.customer_name,
                  company: shipment.details?.to_address?.company,
                  street1: shipment.details?.to_address?.street1,
                  street2: shipment.details?.to_address?.street2,
                  city: shipment.details?.to_address?.city,
                  state: shipment.details?.to_address?.state,
                  zip: shipment.details?.to_address?.zip,
                  country: shipment.details?.to_address?.country || 'US',
                  phone: shipment.details?.to_address?.phone,
                },
                parcel: {
                  length: shipment.details?.parcel?.length || 8,
                  width: shipment.details?.parcel?.width || 6,
                  height: shipment.details?.parcel?.height || 4,
                  weight: shipment.details?.parcel?.weight || 16,
                }
              }
            });
            
            if (error) {
              console.error('Error fetching rates for shipment:', error);
              return;
            }
            
            if (data && data.rates) {
              // Apply additional markup and standardize carrier names
              const processedRates = data.rates.map(rate => {
                const originalRate = parseFloat(rate.rate);
                const markedUpRate = applyRateMarkup(originalRate);
                const standardizedCarrier = standardizeCarrierName(rate.carrier);
                const standardizedService = standardizeServiceName(rate.service, standardizedCarrier);
                
                return {
                  ...rate,
                  carrier: standardizedCarrier,
                  service: standardizedService,
                  original_carrier: rate.carrier,
                  original_service: rate.service,
                  rate: markedUpRate.toFixed(2),
                  original_rate: originalRate.toFixed(2),
                  markup_percentage: RATE_MARKUP_PERCENTAGE,
                  discount_percentage: RATE_MARKUP_PERCENTAGE,
                  currency: rate.currency || 'USD'
                };
              });
              
              const actualIndex = i + index;
              updatedShipments[actualIndex] = {
                ...shipment,
                availableRates: processedRates,
                selectedRateId: processedRates[0]?.id,
                carrier: processedRates[0]?.carrier || shipment.carrier,
                service: processedRates[0]?.service || shipment.service,
                rate: parseFloat(processedRates[0]?.rate) || shipment.rate,
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
      
      // Calculate new total cost including insurance
      const newTotalCost = updatedShipments.reduce((total, shipment) => {
        const rateAmount = shipment.rate || 0;
        const insuranceCost = shipment.details?.insurance_enabled !== false 
          ? (shipment.details?.declared_value || 200) * 0.01 
          : 0;
        return total + rateAmount + insuranceCost;
      }, 0);
      
      updateResults({
        ...results,
        processedShipments: updatedShipments,
        totalCost: newTotalCost,
      });
      
      console.log(`Live rates fetched successfully with ${RATE_MARKUP_PERCENTAGE}% markup`);
      toast.success(`Live shipping rates updated with ${RATE_MARKUP_PERCENTAGE}% markup`);
      
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
    
    // Calculate new total cost including insurance
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      const rateAmount = shipment.rate || 0;
      const insuranceCost = shipment.details?.insurance_enabled !== false 
        ? (shipment.details?.declared_value || 200) * 0.01 
        : 0;
      return total + rateAmount + insuranceCost;
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
      
      console.log('Refreshing rates for shipment:', shipmentId);
      
      const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
          fromAddress: results.pickupAddress,
          toAddress: {
            name: shipment.details?.to_address?.name || shipment.customer_name,
            company: shipment.details?.to_address?.company,
            street1: shipment.details?.to_address?.street1,
            street2: shipment.details?.to_address?.street2,
            city: shipment.details?.to_address?.city,
            state: shipment.details?.to_address?.state,
            zip: shipment.details?.to_address?.zip,
            country: shipment.details?.to_address?.country || 'US',
            phone: shipment.details?.to_address?.phone,
          },
          parcel: {
            length: shipment.details?.parcel?.length || 8,
            width: shipment.details?.parcel?.width || 6,
            height: shipment.details?.parcel?.height || 4,
            weight: shipment.details?.parcel?.weight || 16,
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.rates) {
        // Apply markup and standardize carrier names for refreshed rates
        const processedRates = data.rates.map(rate => {
          const originalRate = parseFloat(rate.rate);
          const markedUpRate = applyRateMarkup(originalRate);
          const standardizedCarrier = standardizeCarrierName(rate.carrier);
          const standardizedService = standardizeServiceName(rate.service, standardizedCarrier);
          
          return {
            ...rate,
            carrier: standardizedCarrier,
            service: standardizedService,
            original_carrier: rate.carrier,
            original_service: rate.service,
            rate: markedUpRate.toFixed(2),
            original_rate: originalRate.toFixed(2),
            markup_percentage: RATE_MARKUP_PERCENTAGE,
            discount_percentage: RATE_MARKUP_PERCENTAGE,
            currency: rate.currency || 'USD'
          };
        });
        
        const updatedShipments = results.processedShipments.map(s => {
          if (s.id === shipmentId) {
            return {
              ...s,
              availableRates: processedRates,
              selectedRateId: processedRates[0]?.id,
              carrier: processedRates[0]?.carrier || s.carrier,
              service: processedRates[0]?.service || s.service,
              rate: parseFloat(processedRates[0]?.rate.toString()) || s.rate,
            };
          }
          return s;
        });
        
        // Calculate new total cost including insurance
        const newTotalCost = updatedShipments.reduce((total, s) => {
          const rateAmount = s.rate || 0;
          const insuranceCost = s.details?.insurance_enabled !== false 
            ? (s.details?.declared_value || 200) * 0.01 
            : 0;
          return total + rateAmount + insuranceCost;
        }, 0);
        
        updateResults({
          ...results,
          processedShipments: updatedShipments,
          totalCost: newTotalCost,
        });
        
        toast.success(`Rates refreshed successfully with ${RATE_MARKUP_PERCENTAGE}% markup`);
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
    
    // Calculate new total cost including insurance
    const newTotalCost = updatedShipments.reduce((total, shipment) => {
      const rateAmount = shipment.rate || 0;
      const insuranceCost = shipment.details?.insurance_enabled !== false 
        ? (shipment.details?.declared_value || 200) * 0.01 
        : 0;
      return total + rateAmount + insuranceCost;
    }, 0);
    
    updateResults({
      ...results,
      processedShipments: updatedShipments,
      totalCost: newTotalCost,
    });
    
    toast.success(`Applied ${carrierName} to all eligible shipments with ${RATE_MARKUP_PERCENTAGE}% markup`);
  };

  // New function to refresh rates after edit
  const handleRefreshRatesAfterEdit = async (shipmentId: string) => {
    console.log('Refreshing rates after edit for shipment:', shipmentId);
    await handleRefreshRates(shipmentId);
  };

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleRefreshRatesAfterEdit,
    handleBulkApplyCarrier,
  };
};

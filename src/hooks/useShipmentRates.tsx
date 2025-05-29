import { useState } from 'react';
import { toast } from 'sonner';
import { BulkShipment, BulkUploadResult, ShippingOption } from '@/types/shipping';
import { carrierService } from '@/services/CarrierService';

export const useShipmentRates = (
  initialResults: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);
  
  const fetchAllShipmentRates = async (shipments: BulkShipment[]) => {
    setIsFetchingRates(true);
    
    try {
      const updatedShipments: BulkShipment[] = [...shipments];
      let successCount = 0;
      
      for (let i = 0; i < updatedShipments.length; i++) {
        const shipment = updatedShipments[i];
        
        try {
          // Update status to show we're processing this shipment
          updatedShipments[i] = { ...shipment, status: 'processing' as const };
          updateResults({
            ...initialResults!,
            processedShipments: updatedShipments
          });
          
          // Fetch real rates for this shipment using CarrierService
          const rates = await fetchShipmentRates(shipment);
          
          // Update shipment with rates
          updatedShipments[i] = { 
            ...shipment, 
            availableRates: rates,
            status: 'completed' as const,
            // Set default selected rate to the cheapest option
            selectedRateId: rates.length > 0 ? rates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0].id : undefined
          };
          
          successCount++;
        } catch (error) {
          console.error(`Error fetching rates for shipment ${shipment.id}:`, error);
          updatedShipments[i] = { 
            ...shipment, 
            status: 'error' as const,
            error: 'Failed to fetch shipping rates' 
          };
        }
        
        // Update UI with progress
        updateResults({
          ...initialResults!,
          processedShipments: updatedShipments
        });
      }
      
      toast.success(`Successfully fetched rates for ${successCount} out of ${shipments.length} shipments`);
      return updatedShipments;
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      toast.error('Failed to fetch rates for some shipments');
      return shipments;
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  const fetchShipmentRates = async (shipment: BulkShipment): Promise<ShippingOption[]> => {
    try {
      console.log('Fetching real rates for shipment:', shipment.id);
      
      // Use the actual CarrierService to get real rates
      const requestData = {
        fromAddress: {
          name: initialResults?.pickupAddress?.name || '',
          company: initialResults?.pickupAddress?.company || '',
          street1: initialResults?.pickupAddress?.street1 || '',
          street2: initialResults?.pickupAddress?.street2 || '',
          city: initialResults?.pickupAddress?.city || '',
          state: initialResults?.pickupAddress?.state || '',
          zip: initialResults?.pickupAddress?.zip || '',
          country: initialResults?.pickupAddress?.country || 'US',
          phone: initialResults?.pickupAddress?.phone || '',
        },
        toAddress: {
          name: shipment.details.name,
          company: shipment.details.company || '',
          street1: shipment.details.street1,
          street2: shipment.details.street2 || '',
          city: shipment.details.city,
          state: shipment.details.state,
          zip: shipment.details.zip,
          country: shipment.details.country || 'US',
          phone: shipment.details.phone || '',
        },
        parcel: {
          length: shipment.details.parcel_length || 12,
          width: shipment.details.parcel_width || 8,
          height: shipment.details.parcel_height || 4,
          weight: shipment.details.parcel_weight || 16,
        }
      };

      const rates = await carrierService.getShippingRates(requestData);
      
      // Convert to our ShippingOption format
      return rates.map(rate => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: rate.rate,
        currency: rate.currency,
        delivery_days: rate.delivery_days,
        delivery_date: rate.delivery_date,
      }));
      
    } catch (error) {
      console.error('Error fetching real shipment rates:', error);
      throw new Error('Failed to fetch shipping rates from API');
    }
  };
  
  const handleSelectRate = (shipmentId: string, rateId: string) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        // Find the selected rate
        const selectedRate = shipment.availableRates?.find(rate => rate.id === rateId);
        
        return { 
          ...shipment, 
          selectedRateId: rateId,
          carrier: selectedRate?.carrier || shipment.carrier,
          service: selectedRate?.service || shipment.service,
          rate: parseFloat(selectedRate?.rate || '0') || shipment.rate
        };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (parseFloat(selectedRate?.rate || '0') || 0);
    }, 0);
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      totalCost
    });
  };
  
  const handleRefreshRates = async (shipmentId: string) => {
    if (!initialResults) return;
    
    // Find the shipment
    const shipment = initialResults.processedShipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    
    // Update shipment status to processing
    const updatedShipments = initialResults.processedShipments.map(s => 
      s.id === shipmentId ? { ...s, status: 'processing' as const } : s
    );
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments
    });
    
    try {
      // Fetch new rates using real API
      const rates = await fetchShipmentRates(shipment);
      
      // Update shipment with new rates
      const finalShipments = updatedShipments.map(s => 
        s.id === shipmentId ? { 
          ...s, 
          availableRates: rates,
          status: 'completed' as const,
          selectedRateId: rates.length > 0 ? rates[0].id : s.selectedRateId
        } : s
      );
      
      updateResults({
        ...initialResults,
        processedShipments: finalShipments
      });
      
      toast.success('Rates updated successfully');
    } catch (error) {
      // Update shipment with error
      const errorShipments = updatedShipments.map(s => 
        s.id === shipmentId ? { 
          ...s, 
          status: 'error' as const,
          error: 'Failed to refresh rates'
        } : s
      );
      
      updateResults({
        ...initialResults,
        processedShipments: errorShipments
      });
      
      toast.error('Failed to update rates');
    }
  };
  
  const handleBulkApplyCarrier = (carrierId: string, serviceId: string) => {
    if (!initialResults) return;
    
    const updatedShipments = initialResults.processedShipments.map(shipment => {
      // Find a rate that matches the selected carrier and service
      const matchingRate = shipment.availableRates?.find(
        rate => rate.carrier === carrierId && rate.service === serviceId
      );
      
      if (matchingRate) {
        return { 
          ...shipment, 
          selectedRateId: matchingRate.id,
          carrier: matchingRate.carrier,
          service: matchingRate.service,
          rate: parseFloat(matchingRate.rate)
        };
      }
      
      // If no matching rate, keep the current selection
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (parseFloat(selectedRate?.rate || '0') || 0);
    }, 0);
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      totalCost
    });
    
    toast.success(`Applied ${carrierId} ${serviceId} to all eligible shipments`);
  };

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier
  };
};

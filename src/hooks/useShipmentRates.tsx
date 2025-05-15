
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { BulkShipment, BulkUploadResult, ShippingOption } from '@/types/shipping';
import { CARRIER_OPTIONS } from '@/types/shipping';

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
          
          // Fetch rates for this shipment
          const rates = await fetchShipmentRates(shipment);
          
          // Update shipment with rates
          updatedShipments[i] = { 
            ...shipment, 
            availableRates: rates,
            status: 'completed' as const,
            // Set default selected rate to the cheapest option
            selectedRateId: rates.length > 0 ? rates.sort((a, b) => a.rate - b.rate)[0].id : undefined
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
      
      toast({
        title: "Rates fetched",
        description: `Successfully fetched rates for ${successCount} out of ${shipments.length} shipments`
      });
      return updatedShipments;
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      toast({
        title: "Fetch failed",
        description: 'Failed to fetch rates for some shipments',
        variant: "destructive"
      });
      return shipments;
    } finally {
      setIsFetchingRates(false);
    }
  };
  
  const fetchShipmentRates = async (shipment: BulkShipment): Promise<ShippingOption[]> => {
    try {
      // Mock function - in a real app, you would call your API to get actual rates
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
      
      // Generate mock rates for each carrier
      const mockRates: ShippingOption[] = CARRIER_OPTIONS.flatMap(carrier => {
        return carrier.services.map(service => {
          // Base rate between $5-25 with some carrier-specific modifiers
          const baseRate = 5 + Math.random() * 20;
          
          // Add carrier-specific pricing
          let rate = baseRate;
          if (carrier.id === 'fedex') rate *= 1.2; // FedEx is 20% more
          if (carrier.id === 'ups') rate *= 1.1; // UPS is 10% more
          if (carrier.id === 'dhl') rate *= 1.3; // DHL is 30% more
          
          // Service-specific adjustments
          if (service.name.includes('Express') || service.name.includes('Overnight')) {
            rate *= 1.5; // Express services cost 50% more
          }
          
          // Weight and dimensions based adjustments
          const weight = shipment.details.parcel_weight || 5;
          rate += weight * 0.5; // Add $0.50 per pound
          
          return {
            id: `${carrier.id}_${service.id}_${shipment.id}`,
            carrier: carrier.name,
            service: service.name,
            rate: parseFloat(rate.toFixed(2)),
            currency: 'USD',
            delivery_days: service.name.includes('Next Day') || service.name.includes('Overnight') 
              ? 1 
              : service.name.includes('2Day') || service.name.includes('2nd Day') 
                ? 2 
                : service.name.includes('3-Day') 
                  ? 3 
                  : Math.floor(3 + Math.random() * 5) // 3-7 days for standard services
          };
        });
      });
      
      return mockRates;
    } catch (error) {
      console.error('Error fetching shipment rates:', error);
      throw new Error('Failed to fetch shipping rates');
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
          rate: selectedRate?.rate || shipment.rate
        };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
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
      // Fetch new rates
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
      
      toast({
        title: "Rates updated",
        description: "Rates updated successfully"
      });
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
      
      toast({
        title: "Rate update failed",
        description: "Failed to update rates",
        variant: "destructive"
      });
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
          rate: matchingRate.rate
        };
      }
      
      // If no matching rate, keep the current selection
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
      return sum + (selectedRate?.rate || 0);
    }, 0);
    
    updateResults({
      ...initialResults,
      processedShipments: updatedShipments,
      totalCost
    });
    
    toast({
      title: "Carrier applied",
      description: `Applied ${carrierId} ${serviceId} to all eligible shipments`
    });
  };

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier
  };
};

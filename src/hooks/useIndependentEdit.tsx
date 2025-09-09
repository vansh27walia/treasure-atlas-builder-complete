import { useState } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';

export const useIndependentEdit = (
  results: BulkUploadResult | null,
  updateResults: (results: BulkUploadResult) => void
) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLocalUpdate = (shipmentId: string, updatedShipment: BulkShipment, newRates: any[]) => {
    if (!results) {
      console.error('useIndependentEdit: No results available');
      return;
    }

    setIsUpdating(true);
    
    try {
      console.log('useIndependentEdit: Processing local update', {
        shipmentId,
        updatedShipment,
        newRatesCount: newRates?.length || 0
      });

      // Transform new rates to our format
      const transformedRates = newRates.map((rate, index) => ({
        id: `rate_${Date.now()}_${index}`,
        carrier: rate.carrier || 'Unknown',
        service: rate.service || 'Standard',
        rate: rate.rate?.toString() || '0',
        currency: rate.currency || 'USD',
        delivery_days: rate.delivery_days || null,
        delivery_date: rate.delivery_date || null,
      }));

      console.log('useIndependentEdit: Transformed rates:', transformedRates);

      // Update the shipment with new data and rates
      const updatedShipments = results.processedShipments.map(shipment => {
        if (shipment.id === shipmentId) {
          // Select the cheapest rate by default
          const cheapestRate = transformedRates.length > 0 
            ? transformedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))[0]
            : null;

          const updatedShipmentWithRates = {
            ...updatedShipment,
            availableRates: transformedRates,
            selectedRateId: cheapestRate?.id,
            carrier: cheapestRate?.carrier || updatedShipment.carrier,
            service: cheapestRate?.service || updatedShipment.service,
            rate: cheapestRate ? parseFloat(cheapestRate.rate) : updatedShipment.rate || 0,
            status: 'completed' as const
          };

          console.log('useIndependentEdit: Updated shipment with rates:', updatedShipmentWithRates);
          return updatedShipmentWithRates;
        }
        return shipment;
      });

      // Recalculate totals
      const totalCost = updatedShipments.reduce((sum, shipment) => {
        return sum + (shipment.rate || 0);
      }, 0);

      const totalInsurance = updatedShipments.reduce((sum, shipment) => {
        return sum + (shipment.insurance_cost || 0);
      }, 0);

      const updatedResults: BulkUploadResult = {
        ...results,
        processedShipments: updatedShipments,
        totalCost,
        totalInsurance
      };

      console.log('useIndependentEdit: Final updated results:', {
        totalShipments: updatedResults.processedShipments.length,
        totalCost: updatedResults.totalCost,
        totalInsurance: updatedResults.totalInsurance
      });

      // Update the frontend
      updateResults(updatedResults);
      
      toast.success('✅ Shipment updated locally with new rates!');
      
    } catch (error) {
      console.error('useIndependentEdit: Error during local update:', error);
      toast.error('❌ Failed to update shipment locally');
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    handleLocalUpdate
  };
};

import { useState, useCallback } from 'react';
import { BulkUploadResult, ShippingRate } from '@/types/shipping';

interface UseShipmentRatesProps {
  results: BulkUploadResult | null;
  updateResults: (newResults: BulkUploadResult) => void;
}

export const useShipmentRates = (
  results: BulkUploadResult | null,
  updateResults: (newResults: BulkUploadResult) => void
) => {
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchAllShipmentRates = useCallback(async (shipments) => {
    setIsFetchingRates(true);
    try {
      const updatedShipments = await Promise.all(
        shipments.map(async (shipment) => {
          try {
            const response = await fetch('/api/shipping/rates', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(shipment),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to fetch rates:', errorData);
              return {
                ...shipment,
                status: 'failed' as const,
                error: errorData.error || 'Failed to fetch rates',
                availableRates: []
              };
            }

            const rates = await response.json();
            return {
              ...shipment,
              availableRates: rates.sort((a, b) => Number(a.rate) - Number(b.rate)),
              status: 'pending' as const
            };
          } catch (error) {
            console.error('Error fetching rates:', error);
            return {
              ...shipment,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error',
              availableRates: []
            };
          }
        })
      );

      // Update the results with the new shipments and reset upload status
      const successfulShipments = updatedShipments.filter(shipment => shipment.status === 'pending');
      const failedShipments = updatedShipments.filter(shipment => shipment.status === 'failed' || shipment.status === 'error');

      const totalCost = successfulShipments.reduce((sum, shipment) => {
        return sum + (shipment.rate || 0);
      }, 0);

      const updatedResults: BulkUploadResult = {
        uploadStatus: 'editing',
        successful: successfulShipments.length,
        failed: failedShipments.length,
        total: updatedShipments.length,
        processedShipments: updatedShipments,
        failedShipments: failedShipments,
        totalCost: totalCost,
      };

      updateResults(updatedResults);
    } finally {
      setIsFetchingRates(false);
    }
  }, [updateResults]);

  const handleSelectRate = useCallback((shipmentId: string, rate: ShippingRate) => {
    if (!results) return;
    
    // Convert rate to number if it's a string
    const rateValue = typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate;
    
    // Update shipments with the selected rate
    const updatedShipments = results.processedShipments.map(shipment => {
      if (shipment.id === shipmentId) {
        return {
          ...shipment,
          selectedRateId: rate.id,
          carrier: rate.carrier,
          service: rate.service,
          rate: rateValue, // Use the converted numeric rate
        };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    // Update the results state
    const updatedResults: BulkUploadResult = {
      ...results,
      processedShipments: updatedShipments,
      totalCost,
    };
    
    updateResults(updatedResults);
  }, [results, updateResults]);

  const handleRefreshRates = useCallback(async (shipmentId: string) => {
    if (!results) return;

    const shipmentToRefresh = results.processedShipments.find(shipment => shipment.id === shipmentId);
    if (!shipmentToRefresh) return;

    setIsFetchingRates(true);
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentToRefresh),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch rates:', errorData);
        return;
      }

      const rates = await response.json();
      const updatedShipments = results.processedShipments.map(shipment => {
        if (shipment.id === shipmentId) {
          return {
            ...shipment,
            availableRates: rates.sort((a, b) => Number(a.rate) - Number(b.rate)),
            status: 'pending' as const
          };
        }
        return shipment;
      });

      const updatedResults: BulkUploadResult = {
        ...results,
        processedShipments: updatedShipments,
      };

      updateResults(updatedResults);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setIsFetchingRates(false);
    }
  }, [results, updateResults]);

  // Update the apply carrier function to ensure numeric rate values
  const handleBulkApplyCarrier = useCallback((carrier: string, service: string) => {
    if (!results) return;
    
    const updatedShipments = results.processedShipments.map(shipment => {
      // Find a rate that matches the carrier and service
      const matchingRate = shipment.availableRates.find(r => 
        r.carrier === carrier && r.service === service
      );
      
      if (matchingRate) {
        // Convert rate to number if it's a string
        const rateValue = typeof matchingRate.rate === 'string' ? 
          parseFloat(matchingRate.rate) : matchingRate.rate;
        
        return {
          ...shipment,
          selectedRateId: matchingRate.id,
          carrier: matchingRate.carrier,
          service: matchingRate.service,
          rate: rateValue, // Use the converted numeric rate
        };
      }
      return shipment;
    });
    
    // Calculate new total cost
    const totalCost = updatedShipments.reduce((sum, shipment) => {
      return sum + (shipment.rate || 0);
    }, 0);
    
    // Update the results state
    const updatedResults: BulkUploadResult = {
      ...results,
      processedShipments: updatedShipments,
      totalCost,
    };
    
    updateResults(updatedResults);
  }, [results, updateResults]);

  return {
    isFetchingRates,
    fetchAllShipmentRates,
    handleSelectRate,
    handleRefreshRates,
    handleBulkApplyCarrier
  };
};

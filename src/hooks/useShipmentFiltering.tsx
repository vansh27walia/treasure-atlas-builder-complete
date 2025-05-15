
import { useState, useMemo } from 'react';
import { BulkUploadResult } from '@/types/shipping';

export const useShipmentFiltering = (results: BulkUploadResult | null) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Update the types to include 'recipient' instead of 'name'
  const [sortField, setSortField] = useState<'recipient' | 'tracking' | 'rate' | 'carrier'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('all');
  
  // Filter and sort the shipments based on search, sort, and filter criteria
  const filteredShipments = useMemo(() => {
    if (!results || !results.processedShipments) {
      return [];
    }
    
    return results.processedShipments
      .filter(shipment => {
        // Filter by carrier if a specific carrier is selected
        if (selectedCarrierFilter !== 'all') {
          const selectedRate = shipment.availableRates?.find(rate => rate.id === shipment.selectedRateId);
          if (selectedRate && selectedRate.carrier.toLowerCase() !== selectedCarrierFilter.toLowerCase()) {
            return false;
          }
        }
        
        // Search by term
        const searchString = [
          shipment.details.name,
          shipment.details.company || '',
          shipment.details.street1,
          shipment.details.street2 || '',
          shipment.details.city,
          shipment.details.state,
          shipment.details.zip,
          shipment.details.country,
          shipment.carrier || '',
          shipment.tracking_code || '',
        ].join(' ').toLowerCase();
        
        return !searchTerm || searchString.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        // Sort by specified field
        if (sortField === 'recipient') {
          // Sort by recipient name
          return sortDirection === 'asc' 
            ? a.details.name.localeCompare(b.details.name)
            : b.details.name.localeCompare(a.details.name);
        } else if (sortField === 'tracking') {
          // Sort by tracking code
          const trackingA = a.tracking_code || '';
          const trackingB = b.tracking_code || '';
          return sortDirection === 'asc' 
            ? trackingA.localeCompare(trackingB)
            : trackingB.localeCompare(trackingA);
        } else if (sortField === 'carrier') {
          // Sort by carrier
          return sortDirection === 'asc' 
            ? (a.carrier || '').localeCompare(b.carrier || '')
            : (b.carrier || '').localeCompare(a.carrier || '');
        }
        
        // Sort by rate - Convert string rates to numbers before comparing
        const rateA = a.availableRates?.find(rate => rate.id === a.selectedRateId)?.rate;
        const rateB = b.availableRates?.find(rate => rate.id === b.selectedRateId)?.rate;
        
        const numericRateA = rateA ? parseFloat(rateA) : 0;
        const numericRateB = rateB ? parseFloat(rateB) : 0;
        
        return sortDirection === 'asc' ? numericRateA - numericRateB : numericRateB - numericRateA;
      });
  }, [results, searchTerm, sortField, sortDirection, selectedCarrierFilter]);

  return {
    searchTerm,
    sortField,
    sortDirection,
    selectedCarrierFilter,
    filteredShipments,
    setSearchTerm,
    setSortField,
    setSortDirection,
    setSelectedCarrierFilter
  };
};

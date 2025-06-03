import { useState, useMemo } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping'; // Assuming these types are correctly defined

export const useShipmentFiltering = (
  results: BulkUploadResult | null
) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Ensuring sortField can also handle a default or empty state if needed, though 'recipient' is a good default.
  const [sortField, setSortField] = useState<'recipient' | 'rate' | 'carrier'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);

  const filteredShipments = useMemo(() => {
    // Corrected Guard: Check both results and results.processedShipments,
    // and ensure processedShipments is an array.
    if (!results || !results.processedShipments || !Array.isArray(results.processedShipments)) {
      return [];
    }
    
    return results.processedShipments
      .filter(shipment => {
        // Assuming `shipment` and `shipment.details` are guaranteed by `BulkShipment` type.
        // If `shipment.details` could be optional, you'd need `shipment.details?.propertyName`.
        // The existing `shipment.details.company || ''` is good for optional properties within details.

        const searchFields = [
          shipment.recipient || '', // Add default empty string for safety
          shipment.details.name || '', // Add default empty string for safety
          shipment.details.company || '', // Already handles optional company
          shipment.details.street1 || '',
          shipment.details.city || '',
          shipment.details.state || '',
          shipment.details.zip || '',
          shipment.carrier || '',
          shipment.service || ''
        ].join(' ').toLowerCase();
        
        const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
        
        // This part for carrier matching seems robust with optional chaining.
        const matchesCarrier = !selectedCarrierFilter || 
          (shipment.availableRates?.some(rate => 
            rate.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase()
          ));
          
        return matchesSearch && matchesCarrier;
      })
      .sort((a, b) => {
        const recipientA = a.recipient || ''; // Default to empty string for safe comparison
        const recipientB = b.recipient || '';
        const carrierA = a.carrier || '';
        const carrierB = b.carrier || '';

        if (sortField === 'recipient') {
          return sortDirection === 'asc' 
            ? recipientA.localeCompare(recipientB)
            : recipientB.localeCompare(recipientA);
        }
        
        if (sortField === 'carrier') {
          return sortDirection === 'asc' 
            ? carrierA.localeCompare(carrierB)
            : carrierB.localeCompare(carrierA);
        }
        
        // Sort by rate - this already handles potential undefined rates robustly.
        const rateA = a.availableRates?.find(rate => rate.id === a.selectedRateId)?.rate || 0;
        const rateB = b.availableRates?.find(rate => rate.id === b.selectedRateId)?.rate || 0;
        
        return sortDirection === 'asc' ? rateA - rateB : rateB - rateA;
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

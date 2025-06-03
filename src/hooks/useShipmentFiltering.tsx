
import { useState, useMemo } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping'; // Assuming these types are correctly defined

export const useShipmentFiltering = (
  results: BulkUploadResult | null
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'rate' | 'carrier'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);

  // Log the incoming results for debugging - you can remove this in production
  console.log('useShipmentFiltering received results:', results);

  const filteredShipments = useMemo(() => {
    // More robust guard: check results, results.processedShipments, and if it's an array
    if (!results || !results.processedShipments || !Array.isArray(results.processedShipments)) {
      console.warn('useShipmentFiltering: results, results.processedShipments, or processedShipments is not a valid array. Returning empty array. Results:', results);
      return [];
    }
    
    return results.processedShipments
      .filter((shipment): shipment is BulkShipment => { // Type guard to ensure shipment is not null/undefined after this
        // Basic check for shipment and essential nested properties
        if (!shipment) {
          console.warn('Filtering out null or undefined shipment object.');
          return false;
        }
        if (!shipment.details) {
          // If shipment.details is critical for every shipment, you might want to log or handle this.
          // For now, we'll allow filtering based on other fields if details are missing,
          // but provide empty strings for details-based search fields.
          console.warn('Shipment found with missing details property:', shipment);
          // Depending on your requirements, you might want to `return false;` here
          // if a shipment without details is considered invalid for display/filtering.
        }

        // Filter by search term
        const searchFields = [
          shipment.recipient || '',
          shipment.details?.name || '', // Use optional chaining and fallback
          shipment.details?.company || '',
          shipment.details?.street1 || '',
          shipment.details?.city || '',
          shipment.details?.state || '',
          shipment.details?.zip || '',
          shipment.carrier || '',
          shipment.service || ''
        ].join(' ').toLowerCase();
        
        const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
        
        // Filter by carrier
        const matchesCarrier = !selectedCarrierFilter || 
          (shipment.availableRates?.some(rate => 
            rate && rate.carrier && rate.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase()
          ));
          
        return matchesSearch && matchesCarrier;
      })
      .sort((a, b) => {
        // Add guards for a and b in case filter somehow passed a null/undefined value,
        // though the type guard in filter should prevent this.
        if (!a && !b) return 0;
        if (!a) return 1; // or -1 depending on desired sort for undefineds
        if (!b) return -1; // or 1

        if (sortField === 'recipient') {
          return sortDirection === 'asc' 
            ? (a.recipient || '').localeCompare(b.recipient || '')
            : (b.recipient || '').localeCompare(a.recipient || '');
        }
        
        if (sortField === 'carrier') {
          return sortDirection === 'asc' 
            ? (a.carrier || '').localeCompare(b.carrier || '')
            : (b.carrier || '').localeCompare(a.carrier || '');
        }
        
        // Sort by rate
        // Ensure selectedRateId is present, otherwise default rate to 0 or handle as needed
        const rateA = a.selectedRateId ? (a.availableRates?.find(rate => rate && rate.id === a.selectedRateId)?.rate || 0) : 0;
        const rateB = b.selectedRateId ? (b.availableRates?.find(rate => rate && rate.id === b.selectedRateId)?.rate || 0) : 0;
        
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
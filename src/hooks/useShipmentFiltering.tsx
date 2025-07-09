
import { useState, useMemo } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export type SortField = 'recipient' | 'rate' | 'carrier';

export const useShipmentFiltering = (
  results: BulkUploadResult | null
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);

  // Filter and sort shipments
  const filteredShipments = useMemo(() => {
    if (!results || !results.processedShipments) return [];
    
    return results.processedShipments
      .filter(shipment => {
        // Filter by search term
        const searchFields = [
          shipment.recipient,
          shipment.details?.name || '',
          shipment.details?.company || '',
          shipment.details?.street1 || '',
          shipment.details?.city || '',
          shipment.details?.state || '',
          shipment.details?.zip || '',
          shipment.carrier,
          shipment.service
        ].join(' ').toLowerCase();
        
        const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());
        
        // Filter by carrier
        const matchesCarrier = !selectedCarrierFilter || 
          (shipment.availableRates?.some(rate => 
            rate.carrier.toLowerCase() === selectedCarrierFilter.toLowerCase()
          ));
          
        return matchesSearch && matchesCarrier;
      })
      .sort((a, b) => {
        if (sortField === 'recipient') {
          return sortDirection === 'asc' 
            ? a.recipient.localeCompare(b.recipient)
            : b.recipient.localeCompare(a.recipient);
        }
        
        if (sortField === 'carrier') {
          return sortDirection === 'asc' 
            ? a.carrier.localeCompare(b.carrier)
            : b.carrier.localeCompare(a.carrier);
        }
        
        // Sort by rate
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

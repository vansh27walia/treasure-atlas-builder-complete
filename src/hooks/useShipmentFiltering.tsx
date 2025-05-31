
import { useState, useMemo } from 'react';
import { BulkShipment, BulkUploadResult } from '@/types/shipping';

export const useShipmentFiltering = (
  results: BulkUploadResult | null
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'rate' | 'carrier'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string | null>(null);

  // Filter and sort shipments
  const filteredShipments = useMemo(() => {
    if (!results) return [];
    
    return results.processedShipments
      .filter(shipment => {
        // Filter by search term - safely access properties with fallbacks
        const searchFields = [
          shipment.recipient || '',
          shipment.details?.name || shipment.details?.to_name || '',
          shipment.details?.company || shipment.details?.to_company || '',
          shipment.details?.street1 || shipment.details?.to_street1 || '',
          shipment.details?.city || shipment.details?.to_city || '',
          shipment.details?.state || shipment.details?.to_state || '',
          shipment.details?.zip || shipment.details?.to_zip || '',
          shipment.carrier || '',
          shipment.service || ''
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
          const aRecipient = a.recipient || '';
          const bRecipient = b.recipient || '';
          return sortDirection === 'asc' 
            ? aRecipient.localeCompare(bRecipient)
            : bRecipient.localeCompare(aRecipient);
        }
        
        if (sortField === 'carrier') {
          const aCarrier = a.carrier || '';
          const bCarrier = b.carrier || '';
          return sortDirection === 'asc' 
            ? aCarrier.localeCompare(bCarrier)
            : bCarrier.localeCompare(aCarrier);
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

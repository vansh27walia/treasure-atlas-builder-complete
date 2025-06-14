
import { useState, useMemo } from 'react';
import { BulkUploadResult, BulkShipment } from '@/types/shipping';

export const useShipmentFiltering = (results: BulkUploadResult | null) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'recipient' | 'carrier' | 'rate' | 'status'>('recipient');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState<string>('');

  const filteredShipments = useMemo(() => {
    if (!results?.processedShipments) return [];

    return results.processedShipments
      .filter(shipment => {
        const searchTermLower = searchTerm.toLowerCase();
        const recipientMatch = shipment.recipient?.toLowerCase().includes(searchTermLower);
        const carrierMatch = shipment.carrier?.toLowerCase().includes(searchTermLower);
        const statusMatch = shipment.status?.toLowerCase().includes(searchTermLower);
        const addressMatch = `${shipment.street1 || ''} ${shipment.city || ''} ${shipment.zip || ''}`.toLowerCase().includes(searchTermLower);

        const matchesSearch = !searchTerm || recipientMatch || carrierMatch || statusMatch || addressMatch;
        const matchesCarrier = !selectedCarrierFilter || shipment.carrier === selectedCarrierFilter;
        
        return matchesSearch && matchesCarrier;
      })
      .sort((a, b) => {
        let aValue: string | number | undefined | null;
        let bValue: string | number | undefined | null;

        switch (sortField) {
          case 'recipient':
            aValue = a.recipient?.toLowerCase();
            bValue = b.recipient?.toLowerCase();
            break;
          case 'carrier':
            aValue = a.carrier?.toLowerCase();
            bValue = b.carrier?.toLowerCase();
            break;
          case 'rate':
            aValue = a.rate; 
            bValue = b.rate;
            break;
          case 'status':
            aValue = a.status?.toLowerCase();
            bValue = b.status?.toLowerCase();
            break;
          default:
            return 0;
        }
        
        const valAIsNull = aValue === undefined || aValue === null;
        const valBIsNull = bValue === undefined || bValue === null;

        if (valAIsNull && valBIsNull) return 0;
        if (valAIsNull) return sortDirection === 'asc' ? 1 : -1; // nulls/undefined last in asc, first in desc
        if (valBIsNull) return sortDirection === 'asc' ? -1 : 1; // nulls/undefined last in asc, first in desc

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        
        // Fallback for mixed types (should ideally not happen with consistent data)
        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
  }, [results, searchTerm, sortField, sortDirection, selectedCarrierFilter]);

  return {
    searchTerm,
    setSearchTerm,
    sortField,
    setSortField: setSortField as React.Dispatch<React.SetStateAction<'recipient' | 'carrier' | 'rate' | 'status'>>,
    sortDirection,
    setSortDirection,
    selectedCarrierFilter,
    setSelectedCarrierFilter,
    filteredShipments,
  };
};

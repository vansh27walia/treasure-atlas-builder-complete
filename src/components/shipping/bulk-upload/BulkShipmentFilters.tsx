
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export type BulkShipmentFilterField = 'recipient' | 'carrier' | 'rate';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: BulkShipmentFilterField;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: BulkShipmentFilterField, direction: 'asc' | 'desc') => void;
  selectedCarrier: string;
  onCarrierFilterChange: (carrier: string) => void;
  onApplyCarrierToAll: (carrier: string) => void;
}

const BulkShipmentFilters: React.FC<BulkShipmentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  selectedCarrier,
  onCarrierFilterChange,
  onApplyCarrierToAll,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shipments..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Select value={sortField} onValueChange={(value) => onSortChange(value as BulkShipmentFilterField, sortDirection)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recipient">Recipient</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
            <SelectItem value="rate">Rate</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </Button>
        
        <Select value={selectedCarrier} onValueChange={onCarrierFilterChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Carriers</SelectItem>
            <SelectItem value="USPS">USPS</SelectItem>
            <SelectItem value="UPS">UPS</SelectItem>
            <SelectItem value="FedEx">FedEx</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedCarrier && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApplyCarrierToAll(selectedCarrier)}
          >
            Apply to All
          </Button>
        )}
      </div>
    </div>
  );
};

export default BulkShipmentFilters;

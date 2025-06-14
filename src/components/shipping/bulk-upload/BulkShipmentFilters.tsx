
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ListFilter, ArrowUpDown, Search } from 'lucide-react';
import { CARRIER_OPTIONS } from '@/types/shipping';

export type SortField = 'recipient' | 'carrier' | 'rate' | 'status';
type SortDirection = 'asc' | 'desc';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
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
  onApplyCarrierToAll
}) => {

  const handleSortFieldChange = (field: SortField) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  const sortOptions: { label: string; value: SortField }[] = [
    { label: 'Recipient', value: 'recipient' },
    { label: 'Carrier', value: 'carrier' },
    { label: 'Rate', value: 'rate' },
    { label: 'Status', value: 'status' },
  ];

  return (
    <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, address, carrier..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center space-x-2">
          <Select value={sortField} onValueChange={(value) => handleSortFieldChange(value as SortField)}>
            <SelectTrigger className="flex-grow">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className={`h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        
        {/* Carrier Filter */}
        <div className="lg:col-span-1">
          <Select value={selectedCarrier} onValueChange={onCarrierFilterChange}>
            <SelectTrigger>
              <ListFilter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter by carrier" />
            </SelectTrigger>
            <SelectContent>
              {CARRIER_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;

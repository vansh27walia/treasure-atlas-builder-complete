
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SortAsc, SortDesc, ArrowDownUp, Check, Globe } from 'lucide-react';
import { CARRIER_OPTIONS } from '@/types/shipping';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
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
  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-4">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by name or address..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        <Select
          value={selectedCarrier}
          onValueChange={onCarrierFilterChange}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by carrier" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {CARRIER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCarrier !== 'all' && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => onApplyCarrierToAll(selectedCarrier)}
            title="Apply this carrier to all shipments"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}

        <div className="flex">
          <Button
            variant={sortField === 'name' ? 'secondary' : 'outline'}
            className="rounded-r-none border-r-0"
            onClick={() => handleSortToggle('name')}
          >
            Name
            {sortField === 'name' && (
              sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />
            )}
          </Button>
          <Button
            variant={sortField === 'rate' ? 'secondary' : 'outline'}
            className="rounded-l-none"
            onClick={() => handleSortToggle('rate')}
          >
            Rate
            {sortField === 'rate' && (
              sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkShipmentFilters;

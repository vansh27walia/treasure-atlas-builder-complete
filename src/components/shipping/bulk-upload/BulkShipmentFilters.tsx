
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CARRIER_OPTIONS } from '@/types/shipping';

interface BulkShipmentFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: 'recipient' | 'tracking' | 'rate' | 'carrier';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: 'recipient' | 'tracking' | 'rate' | 'carrier', direction: 'asc' | 'desc') => void;
  selectedCarrier: string;
  onCarrierFilterChange: (carrier: string) => void;
  onApplyCarrierToAll: (carrierId: string, serviceId: string) => void;
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
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6 items-start md:items-center justify-between">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search shipments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 bg-white"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {/* Carrier Filter */}
        <Select 
          value={selectedCarrier} 
          onValueChange={onCarrierFilterChange}
        >
          <SelectTrigger className="w-[140px] bg-white">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All Carriers</SelectItem>
              {CARRIER_OPTIONS.map(carrier => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        {/* Sort Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white">
              Sort: {getSortLabel(sortField, sortDirection)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => onSortChange('recipient', 'asc')}>
              Recipient (A-Z)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('recipient', 'desc')}>
              Recipient (Z-A)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('rate', 'asc')}>
              Price (Low-High)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('rate', 'desc')}>
              Price (High-Low)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('carrier', 'asc')}>
              Carrier (A-Z)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Bulk Apply Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-white">
              Bulk Apply Rate
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[220px] max-h-[400px] overflow-y-auto">
            {CARRIER_OPTIONS.map(carrier => (
              carrier.services.map(service => (
                <DropdownMenuItem 
                  key={`${carrier.id}_${service.id}`}
                  onClick={() => onApplyCarrierToAll(carrier.name, service.name)}
                >
                  {carrier.name}: {service.name}
                </DropdownMenuItem>
              ))
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Helper function to get display label for sort options
function getSortLabel(field: string, direction: string): string {
  switch (field) {
    case 'recipient':
      return direction === 'asc' ? 'Recipient (A-Z)' : 'Recipient (Z-A)';
    case 'rate':
      return direction === 'asc' ? 'Price (Low-High)' : 'Price (High-Low)';
    case 'carrier':
      return 'Carrier (A-Z)';
    case 'tracking':
      return 'Tracking';
    default:
      return 'Default';
  }
}

export default BulkShipmentFilters;

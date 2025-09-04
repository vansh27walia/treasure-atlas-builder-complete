
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

interface CompactRateFilterProps {
  filters: {
    search: string;
    selectedCarrier: string;
    maxPrice?: number;
    maxDays?: number;
    sortBy: 'price' | 'speed' | 'carrier';
    sortOrder: 'asc' | 'desc';
  };
  availableCarriers: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  rateCount: number;
}

const CompactRateFilter: React.FC<CompactRateFilterProps> = ({
  filters,
  availableCarriers,
  onFiltersChange,
  onClearFilters,
  rateCount
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleCarrierChange = (carrier: string) => {
    onFiltersChange({ ...filters, selectedCarrier: carrier });
  };

  const handleSortChange = (sortBy: string) => {
    onFiltersChange({ ...filters, sortBy });
  };

  const handleSortOrderToggle = () => {
    onFiltersChange({ 
      ...filters, 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) + 
    (filters.selectedCarrier !== 'all' ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.maxDays ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 space-y-3">
      {/* Compact Controls Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Small Search */}
        <div className="relative w-32">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
          <Input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-7 h-8 text-xs border-gray-300"
          />
        </div>

        {/* Carrier Dropdown */}
        <Select value={filters.selectedCarrier} onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="All Carriers">
              <div className="flex items-center gap-1">
                {filters.selectedCarrier === 'all' ? (
                  'All Carriers'
                ) : (
                  <>
                    <CarrierLogo carrier={filters.selectedCarrier} className="w-3 h-3" />
                    {filters.selectedCarrier.toUpperCase()}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">All Carriers</SelectItem>
            {availableCarriers.map(carrier => (
              <SelectItem key={carrier} value={carrier}>
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier} className="w-3 h-3" />
                  {carrier.toUpperCase()}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSortOrderToggle}
          className="h-8 px-2"
        >
          {filters.sortOrder === 'asc' ? 
            <SortAsc className="h-3 w-3" /> : 
            <SortDesc className="h-3 w-3" />
          }
        </Button>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <div className="flex items-center">
                <Filter className="h-3 w-3 mr-1" />
                More
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3 bg-white">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Max Price ($)</label>
                <Input
                  type="number"
                  placeholder="Enter max price"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="mt-1 h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Max Days</label>
                <Input
                  type="number"
                  placeholder="Enter max days"
                  value={filters.maxDays || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxDays: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="mt-1 h-8"
                />
              </div>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="w-full h-8 text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{rateCount} rate{rateCount !== 1 ? 's' : ''} found</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} active
          </Badge>
        )}
      </div>
    </div>
  );
};

export default CompactRateFilter;

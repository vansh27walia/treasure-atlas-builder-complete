
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Search, SortAsc, SortDesc, ChevronDown } from 'lucide-react';

interface ImprovedRateFilterProps {
  filters: {
    search: string;
    carriers: string[];
    maxPrice?: number;
    maxDays?: number;
    sortBy: 'price' | 'speed' | 'carrier';
    sortOrder: 'asc' | 'desc';
    selectedCarrier: string;
  };
  availableCarriers: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  rateCount: number;
}

const ImprovedRateFilter: React.FC<ImprovedRateFilterProps> = ({
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
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
      {/* Top Row - Main Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Compact Search */}
        <div className="relative w-48">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm border-gray-300"
          />
        </div>

        {/* Carrier Dropdown */}
        <Select value={filters.selectedCarrier} onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Carriers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            {availableCarriers.map(carrier => (
              <SelectItem key={carrier} value={carrier}>
                {carrier.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleSortOrderToggle}
          className="h-9 px-2"
        >
          {filters.sortOrder === 'asc' ? 
            <SortAsc className="h-4 w-4" /> : 
            <SortDesc className="h-4 w-4" />
          }
        </Button>

        {/* Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-1" />
              Advanced
              {activeFiltersCount > 0 ? (
                <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                  {activeFiltersCount}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Max Price ($)</label>
                <Input
                  type="number"
                  placeholder="Enter max price"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Max Days</label>
                <Input
                  type="number"
                  placeholder="Enter max days"
                  value={filters.maxDays || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxDays: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="mt-1"
                />
              </div>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {rateCount} rate{rateCount !== 1 ? 's' : ''}</span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ImprovedRateFilter;

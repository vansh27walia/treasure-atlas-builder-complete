
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Search, SortAsc, SortDesc, ChevronDown, X } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

interface RateFilterProps {
  filters: {
    search: string;
    carriers: string[];
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

const ImprovedRateFilter: React.FC<RateFilterProps> = ({
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
    if (carrier === 'all') {
      onFiltersChange({ ...filters, carriers: [] });
    } else {
      const newCarriers = filters.carriers.includes(carrier)
        ? filters.carriers.filter(c => c !== carrier)
        : [...filters.carriers, carrier];
      onFiltersChange({ ...filters, carriers: newCarriers });
    }
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
    filters.carriers.length + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.maxDays ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
      {/* Top Row - Search and Carrier Filter */}
      <div className="flex gap-3 items-center">
        {/* Compact Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search carriers..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm border-gray-300 focus:border-blue-500"
          />
        </div>

        {/* Carrier Dropdown */}
        <Select onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-48 h-9">
            <SelectValue placeholder="Filter by Carrier">
              {filters.carriers.length === 0 ? (
                "All Carriers"
              ) : filters.carriers.length === 1 ? (
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={filters.carriers[0]} className="w-4 h-4" />
                  {filters.carriers[0].toUpperCase()}
                </div>
              ) : (
                `${filters.carriers.length} Carriers`
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="all" className="hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                All Carriers
              </div>
            </SelectItem>
            {availableCarriers.map((carrier) => (
              <SelectItem key={carrier} value={carrier} className="hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={carrier} className="w-4 h-4" />
                  {carrier.toUpperCase()}
                  {filters.carriers.includes(carrier) && (
                    <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                      ✓
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Controls */}
        <Select value={filters.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="speed">Speed</SelectItem>
            <SelectItem value="carrier">Carrier</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={handleSortOrderToggle} className="h-9 w-9 p-0">
          {filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>

        {/* Advanced Filters Toggle */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white border shadow-lg z-50" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-blue-600">
                    Clear All
                  </Button>
                )}
              </div>

              {/* Price Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Price ($)
                </Label>
                <Input
                  type="number"
                  placeholder="Enter max price"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  className="bg-white"
                />
              </div>

              {/* Delivery Time */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Max Delivery Days
                </Label>
                <Input
                  type="number"
                  placeholder="Enter max days"
                  value={filters.maxDays || ''}
                  onChange={(e) => onFiltersChange({ 
                    ...filters, 
                    maxDays: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  className="bg-white"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Showing {rateCount} rate{rateCount !== 1 ? 's' : ''}
          </span>
          {filters.carriers.map(carrier => (
            <Badge key={carrier} variant="secondary" className="bg-blue-100 text-blue-800">
              <CarrierLogo carrier={carrier} className="w-3 h-3 mr-1" />
              {carrier.toUpperCase()}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => handleCarrierChange(carrier)}
              />
            </Badge>
          ))}
        </div>
        {activeFiltersCount > 0 && (
          <Badge variant="outline" className="border-blue-200 text-blue-800">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ImprovedRateFilter;

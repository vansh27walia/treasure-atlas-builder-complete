
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, SortAsc, SortDesc, X, DollarSign, Clock, Truck } from 'lucide-react';

interface ImprovedRateFilterProps {
  filters: {
    search: string;
    carriers: string[];
    maxPrice?: number;
    maxDays?: number;
    features: string[];
    sortBy: 'price' | 'speed' | 'carrier' | 'reliability';
    sortOrder: 'asc' | 'desc';
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleCarrierToggle = (carrier: string) => {
    const newCarriers = filters.carriers.includes(carrier)
      ? filters.carriers.filter(c => c !== carrier)
      : [...filters.carriers, carrier];
    onFiltersChange({ ...filters, carriers: newCarriers });
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];
    onFiltersChange({ ...filters, features: newFeatures });
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

  const handleMaxPriceChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      maxPrice: value ? parseFloat(value) : undefined 
    });
  };

  const handleMaxDaysChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      maxDays: value ? parseInt(value) : undefined 
    });
  };

  const activeFiltersCount = 
    filters.carriers.length + 
    filters.features.length + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.maxDays ? 1 : 0) +
    (filters.search ? 1 : 0);

  const clearIndividualFilter = (type: string, value?: string) => {
    switch (type) {
      case 'search':
        onFiltersChange({ ...filters, search: '' });
        break;
      case 'carrier':
        if (value) {
          const newCarriers = filters.carriers.filter(c => c !== value);
          onFiltersChange({ ...filters, carriers: newCarriers });
        }
        break;
      case 'maxPrice':
        onFiltersChange({ ...filters, maxPrice: undefined });
        break;
      case 'maxDays':
        onFiltersChange({ ...filters, maxDays: undefined });
        break;
      case 'feature':
        if (value) {
          const newFeatures = filters.features.filter(f => f !== value);
          onFiltersChange({ ...filters, features: newFeatures });
        }
        break;
    }
  };

  return (
    <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search Input */}
        <div className="flex-1 min-w-0 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search carriers or services..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 items-center">
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price
                </div>
              </SelectItem>
              <SelectItem value="speed">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Speed
                </div>
              </SelectItem>
              <SelectItem value="carrier">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Carrier
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="icon"
            onClick={handleSortOrderToggle}
            className="shrink-0"
          >
            {filters.sortOrder === 'asc' ? 
              <SortAsc className="h-4 w-4" /> : 
              <SortDesc className="h-4 w-4" />
            }
          </Button>

          {/* Advanced Filters */}
          <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Advanced Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onClearFilters}
                      className="text-blue-600 hover:text-blue-800 h-auto p-1"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Carrier Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Carriers
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableCarriers.map(carrier => (
                      <div key={carrier} className="flex items-center space-x-2">
                        <Checkbox
                          id={`carrier-${carrier}`}
                          checked={filters.carriers.includes(carrier)}
                          onCheckedChange={() => handleCarrierToggle(carrier)}
                        />
                        <Label 
                          htmlFor={`carrier-${carrier}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {carrier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price and Time Filters */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Max Price ($)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 50"
                      value={filters.maxPrice || ''}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Max Days
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g. 3"
                      value={filters.maxDays || ''}
                      onChange={(e) => handleMaxDaysChange(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>

                {/* Service Features */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">
                    Service Features
                  </Label>
                  <div className="space-y-2">
                    {[
                      { id: 'express', label: 'Express Service' },
                      { id: 'insured', label: 'Insurance Available' },
                      { id: 'tracking', label: 'Tracking Included' },
                      { id: 'premium', label: 'Premium Service' }
                    ].map(feature => (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={filters.features.includes(feature.id)}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                        />
                        <Label 
                          htmlFor={`feature-${feature.id}`} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {feature.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex items-center gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-blue-900" 
                onClick={() => clearIndividualFilter('search')}
              />
            </Badge>
          )}
          {filters.carriers.map(carrier => (
            <Badge key={carrier} variant="secondary" className="bg-green-100 text-green-800 flex items-center gap-1">
              {carrier}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-green-900" 
                onClick={() => clearIndividualFilter('carrier', carrier)}
              />
            </Badge>
          ))}
          {filters.maxPrice && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
              Max: ${filters.maxPrice}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-yellow-900" 
                onClick={() => clearIndividualFilter('maxPrice')}
              />
            </Badge>
          )}
          {filters.maxDays && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 flex items-center gap-1">
              Max: {filters.maxDays} days
              <X 
                className="h-3 w-3 cursor-pointer hover:text-purple-900" 
                onClick={() => clearIndividualFilter('maxDays')}
              />
            </Badge>
          )}
          {filters.features.map(feature => (
            <Badge key={feature} variant="secondary" className="bg-indigo-100 text-indigo-800 flex items-center gap-1">
              {feature}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-indigo-900" 
                onClick={() => clearIndividualFilter('feature', feature)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Showing {rateCount} shipping option{rateCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};

export default ImprovedRateFilter;

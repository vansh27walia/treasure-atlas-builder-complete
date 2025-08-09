
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Filter, Zap, DollarSign, Clock, Shield, Star, Search, SortAsc, SortDesc, ChevronDown } from 'lucide-react';

interface RateFilterProps {
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

const RateFilter: React.FC<RateFilterProps> = ({
  filters,
  availableCarriers,
  onFiltersChange,
  onClearFilters,
  rateCount
}) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const activeFiltersCount = 
    filters.carriers.length + 
    filters.features.length + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.maxDays ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Quick Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search carriers or services..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-white border-2 border-gray-200 focus:border-blue-500"
          />
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[140px] justify-between">
              Sort: {filters.sortBy === 'price' ? 'Price' : 
                    filters.sortBy === 'speed' ? 'Speed' : 
                    filters.sortBy === 'carrier' ? 'Carrier' : 'Reliability'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
            <DropdownMenuItem onClick={() => handleSortChange('price')}>
              <DollarSign className="h-4 w-4 mr-2" />
              Price
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('speed')}>
              <Clock className="h-4 w-4 mr-2" />
              Speed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('carrier')}>
              <Filter className="h-4 w-4 mr-2" />
              Carrier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSortChange('reliability')}>
              <Star className="h-4 w-4 mr-2" />
              Reliability
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Order Toggle */}
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

        {/* Advanced Filters Toggle */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[120px] justify-between">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-white border border-gray-200 shadow-lg" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filter Options</h3>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onClearFilters}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Carrier Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Carriers
                </Label>
                <div className="space-y-2">
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
                        {carrier.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </div>
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

              {/* Service Features */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Service Features
                </Label>
                <div className="space-y-2">
                  {[
                    { id: 'express', label: 'Express Service', icon: Zap },
                    { id: 'insured', label: 'Insurance Available', icon: Shield },
                    { id: 'tracking', label: 'Tracking Included', icon: Search },
                    { id: 'premium', label: 'Premium Service', icon: Star }
                  ].map(feature => {
                    const Icon = feature.icon;
                    return (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`feature-${feature.id}`}
                          checked={filters.features.includes(feature.id)}
                          onCheckedChange={() => handleFeatureToggle(feature.id)}
                        />
                        <Label 
                          htmlFor={`feature-${feature.id}`} 
                          className="text-sm font-medium cursor-pointer flex items-center gap-1"
                        >
                          <Icon className="h-4 w-4" />
                          {feature.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Showing {rateCount} rate{rateCount !== 1 ? 's' : ''}
        </span>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
          </Badge>
        )}
      </div>
    </div>
  );
};

export default RateFilter;

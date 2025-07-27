
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Zap, DollarSign, Shield, Star, Clock, Truck, Package, Leaf } from 'lucide-react';

interface RateFilterDropdownProps {
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
  rateCount: number;
}

const RateFilterDropdown: React.FC<RateFilterDropdownProps> = ({
  onFilterChange,
  selectedFilter,
  rateCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All Rates', icon: Filter, description: 'Show all available rates' },
    { value: 'cheapest', label: 'Cheapest First', icon: DollarSign, description: 'Sort by lowest price' },
    { value: 'fastest', label: 'Fastest First', icon: Zap, description: 'Sort by delivery speed' },
    { value: 'balanced', label: 'Best Value', icon: Star, description: 'Best price-to-speed ratio' },
    { value: 'most-reliable', label: 'Most Reliable', icon: Shield, description: 'Most dependable carriers' },
    { value: 'express', label: 'Express Only', icon: Clock, description: 'Next-day and 2-day delivery' },
    { value: 'ground', label: 'Ground Only', icon: Truck, description: 'Standard ground shipping' },
    { value: 'international', label: 'International', icon: Package, description: 'International shipping only' },
    { value: 'eco-friendly', label: 'Eco-Friendly', icon: Leaf, description: 'Carbon-neutral options' }
  ];

  const quickFilters = filterOptions.slice(1, 4); // Cheapest, Fastest, Best Value
  const allFilters = filterOptions.slice(4); // Rest of the filters

  const selectedOption = filterOptions.find(option => option.value === selectedFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Filter Rates</span>
          <Badge variant="outline" className="text-xs">
            {rateCount} rates
          </Badge>
        </div>
      </div>

      {/* Main Filter Dropdown */}
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full border-2 hover:border-blue-300 focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder="Filter shipping rates">
            {selectedOption && (
              <div className="flex items-center gap-2">
                <selectedOption.icon className="w-4 h-4" />
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white border-2 shadow-lg z-50">
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="hover:bg-blue-50">
              <div className="flex items-center gap-2 py-1">
                <option.icon className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Quick Filter Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Quick Filters</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show Less' : 'Show All'}
          </Button>
        </div>

        {/* Top 3 Quick Filters */}
        <div className="grid grid-cols-1 gap-2">
          {quickFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "outline"}
              size="sm"
              className={`justify-start h-auto p-3 ${
                selectedFilter === filter.value 
                  ? "bg-blue-600 text-white border-blue-600" 
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              }`}
              onClick={() => onFilterChange(filter.value)}
            >
              <filter.icon className="w-4 h-4 mr-2" />
              <div className="text-left">
                <div className="font-medium text-sm">{filter.label}</div>
                <div className={`text-xs ${
                  selectedFilter === filter.value ? "text-blue-100" : "text-gray-500"
                }`}>
                  {filter.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-200">
            {allFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "outline"}
                size="sm"
                className={`justify-start h-auto p-2 text-sm ${
                  selectedFilter === filter.value 
                    ? "bg-blue-600 text-white border-blue-600" 
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
                onClick={() => onFilterChange(filter.value)}
              >
                <filter.icon className="w-4 h-4 mr-2" />
                <div className="text-left">
                  <div className="font-medium">{filter.label}</div>
                  <div className={`text-xs ${
                    selectedFilter === filter.value ? "text-blue-100" : "text-gray-500"
                  }`}>
                    {filter.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Active Filter Display */}
      {selectedFilter !== 'all' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedOption && <selectedOption.icon className="w-4 h-4 text-blue-600" />}
              <span className="text-sm font-medium text-blue-800">
                Active Filter: {selectedOption?.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange('all')}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            {selectedOption?.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default RateFilterDropdown;

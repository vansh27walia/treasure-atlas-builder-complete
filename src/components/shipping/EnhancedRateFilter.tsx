import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter, Search, SortAsc, SortDesc, X, Sparkles } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

interface EnhancedRateFilterProps {
  filters: {
    search: string;
    carriers: string[];
    maxPrice?: number;
    maxDays?: number;
    features: string[];
    sortBy: 'price' | 'speed' | 'carrier' | 'reliability';
    sortOrder: 'asc' | 'desc';
    selectedCarrier: string;
  };
  availableCarriers: string[];
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  rateCount: number;
}

const EnhancedRateFilter: React.FC<EnhancedRateFilterProps> = ({
  filters,
  availableCarriers,
  onFiltersChange,
  onClearFilters,
  rateCount
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSearchChange = (value: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, search: value });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleCarrierChange = (carrier: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, selectedCarrier: carrier });
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleSortChange = (sortBy: string) => {
    setIsAnimating(true);
    onFiltersChange({ ...filters, sortBy });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleSortOrderToggle = () => {
    setIsAnimating(true);
    onFiltersChange({ 
      ...filters, 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    });
    setTimeout(() => setIsAnimating(false), 200);
  };

  const activeFiltersCount = 
    (filters.search ? 1 : 0) + 
    (filters.selectedCarrier && filters.selectedCarrier !== 'all' ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0) + 
    (filters.maxDays ? 1 : 0);

  return (
    <div className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl shadow-sm border border-gray-200/60 p-5 space-y-4 transition-all duration-300 hover:shadow-md">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Filter & Sort Rates</h3>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Main Controls Row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Enhanced Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 h-4 w-4 transition-colors duration-200" />
          <Input
            type="text"
            placeholder="Search carriers or services..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 w-64 h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Enhanced Carrier Dropdown */}
        <Select value={filters.selectedCarrier || 'all'} onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-48 h-10 border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm">
            <SelectValue>
              <div className="flex items-center gap-2">
                {(!filters.selectedCarrier || filters.selectedCarrier === 'all') ? (
                  <>
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span>All Carriers</span>
                  </>
                ) : (
                  <>
                    <CarrierLogo carrier={filters.selectedCarrier} className="w-5 h-5" />
                    <span className="font-medium">{filters.selectedCarrier.toUpperCase()}</span>
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-md border-gray-200 shadow-lg">
            <SelectItem value="all" className="hover:bg-blue-50 transition-colors duration-150">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium">All Carriers</span>
              </div>
            </SelectItem>
            {availableCarriers.map(carrier => (
              <SelectItem key={carrier} value={carrier} className="hover:bg-blue-50 transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <CarrierLogo carrier={carrier} className="w-5 h-5" />
                  <span className="font-medium">{carrier.toUpperCase()}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Enhanced Sort Controls */}
        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-36 h-10 border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md">
              <SelectItem value="price">💰 Price</SelectItem>
              <SelectItem value="speed">⚡ Speed</SelectItem>
              <SelectItem value="carrier">🚚 Carrier</SelectItem>
              <SelectItem value="reliability">⭐ Reliability</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSortOrderToggle}
            className="h-10 px-3 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 bg-white/80 backdrop-blur-sm"
          >
            {filters.sortOrder === 'asc' ? 
              <SortAsc className="h-4 w-4" /> : 
              <SortDesc className="h-4 w-4" />
            }
          </Button>
        </div>

        {/* Enhanced Advanced Filters */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-10 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 bg-white/80 backdrop-blur-sm ${
                activeFiltersCount > 0 ? 'border-purple-500 bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs bg-purple-100 text-purple-700 animate-pulse">
                    {activeFiltersCount}
                  </Badge>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 bg-white/95 backdrop-blur-md border-gray-200 shadow-xl">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Price ($)</label>
                  <Input
                    type="number"
                    placeholder="Enter maximum price"
                    value={filters.maxPrice || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Max Delivery Days</label>
                  <Input
                    type="number"
                    placeholder="Enter maximum days"
                    value={filters.maxDays || ''}
                    onChange={(e) => onFiltersChange({ 
                      ...filters, 
                      maxDays: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onClearFilters();
                    setIsAdvancedOpen(false);
                  }}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Enhanced Results Count with Animation */}
      <div className={`flex items-center justify-between transition-all duration-300 ${isAnimating ? 'opacity-60 scale-95' : 'opacity-100 scale-100'}`}>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {rateCount} rate{rateCount !== 1 ? 's' : ''} found
          </div>
          {isAnimating && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRateFilter;
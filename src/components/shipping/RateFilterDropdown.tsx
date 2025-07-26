import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Filter, Zap, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface RateFilterDropdownProps {
  onCarrierFilter: (carrier: string) => void;
  onSortFilter: (sort: string) => void;
  availableCarriers: string[];
  selectedCarrier?: string;
  selectedSort?: string;
  rateCount?: number;
  showQuickChanges?: boolean;
}

const RateFilterDropdown: React.FC<RateFilterDropdownProps> = ({
  onCarrierFilter,
  onSortFilter,
  availableCarriers,
  selectedCarrier = 'all',
  selectedSort = 'default',
  rateCount = 0,
  showQuickChanges = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const carrierOptions = [
    { value: 'all', label: 'All Carriers', count: rateCount },
    ...availableCarriers.map(carrier => ({
      value: carrier.toLowerCase(),
      label: carrier.toUpperCase(),
      count: 0 // Would need to calculate actual count
    }))
  ];

  const sortOptions = [
    { value: 'default', label: 'Default Order', icon: '📋' },
    { value: 'cheapest', label: 'Price: Low to High', icon: '💰' },
    { value: 'fastest', label: 'Fastest Delivery', icon: '⚡' },
    { value: 'balanced', label: 'Best Value', icon: '✅' },
    { value: 'express', label: 'Express Only', icon: '🚀' },
    { value: 'ground', label: 'Ground Only', icon: '🚛' },
    { value: 'overnight', label: 'Overnight', icon: '🌙' },
    { value: 'two-day', label: '2-Day Delivery', icon: '📅' }
  ];

  const handleQuickChange = (sortValue: string) => {
    onSortFilter(sortValue);
    toast.success(`Applied ${sortOptions.find(opt => opt.value === sortValue)?.label} filter`);
  };

  if (rateCount === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold text-gray-900">Filter & Sort Rates</h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {rateCount} rates found
          </Badge>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Carrier Filter */}
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-600" />
            <Select value={selectedCarrier} onValueChange={onCarrierFilter}>
              <SelectTrigger className="w-40 border-2">
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                {carrierOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count > 0 && (
                        <span className="ml-2 text-xs text-gray-500">({option.count})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <Select value={selectedSort} onValueChange={onSortFilter}>
              <SelectTrigger className="w-48 border-2">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Quick Changes Section */}
      {showQuickChanges && (
        <div className="mt-4 pt-4 border-t-2 border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Quick Changes
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isOpen ? 'Hide' : 'Show More'} 
              <ChevronDown className={`w-4 h-4 ml-1 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
          
          {/* Always visible quick options */}
          <div className="flex flex-wrap gap-2 mb-3">
            {sortOptions.slice(1, 4).map((option) => (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => handleQuickChange(option.value)}
                className="border-2 hover:bg-blue-50 hover:border-blue-300"
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>

          {/* Expandable additional options */}
          {isOpen && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              {sortOptions.slice(4).map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickChange(option.value)}
                  className="border-2 hover:bg-gray-50 hover:border-gray-300"
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RateFilterDropdown;

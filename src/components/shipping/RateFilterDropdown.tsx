
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, DollarSign, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RateFilterDropdownProps {
  onCarrierFilter: (carrier: string) => void;
  onSortFilter: (sort: string) => void;
  availableCarriers: string[];
  selectedCarrier: string;
  selectedSort: string;
  rateCount: number;
}

const RateFilterDropdown: React.FC<RateFilterDropdownProps> = ({
  onCarrierFilter,
  onSortFilter,
  availableCarriers,
  selectedCarrier,
  selectedSort,
  rateCount
}) => {
  const [isFiltered, setIsFiltered] = useState(false);

  const handleCarrierChange = (carrier: string) => {
    onCarrierFilter(carrier);
    setIsFiltered(carrier !== 'all');
  };

  const handleSortChange = (sort: string) => {
    onSortFilter(sort);
  };

  const resetFilters = () => {
    onCarrierFilter('all');
    onSortFilter('default');
    setIsFiltered(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filter & Sort Rates</h3>
          <Badge variant="secondary" className="text-xs">
            {rateCount} rates
          </Badge>
        </div>
        
        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Carrier Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Carrier</label>
          <Select value={selectedCarrier} onValueChange={handleCarrierChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {availableCarriers.map((carrier) => (
                <SelectItem key={carrier} value={carrier.toLowerCase()}>
                  {carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Sort By</label>
          <Select value={selectedSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="cheapest">Lowest Price</SelectItem>
              <SelectItem value="fastest">Fastest Delivery</SelectItem>
              <SelectItem value="balanced">Best Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Quick Actions</label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('cheapest')}
              className="flex items-center gap-1 text-xs"
            >
              <DollarSign className="w-3 h-3" />
              Cheapest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('fastest')}
              className="flex items-center gap-1 text-xs"
            >
              <Clock className="w-3 h-3" />
              Fastest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSortChange('balanced')}
              className="flex items-center gap-1 text-xs"
            >
              <TrendingUp className="w-3 h-3" />
              Balanced
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateFilterDropdown;

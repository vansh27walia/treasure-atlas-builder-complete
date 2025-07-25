
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, Zap, DollarSign, Target, Truck } from 'lucide-react';

interface CarrierFilterBarProps {
  carrierFilter: string;
  onCarrierFilterChange: (carrier: string) => void;
  onQuickSelect: (type: 'cheapest' | 'fastest' | 'balanced') => void;
  availableCarriers: string[];
  rateCount: number;
}

const CarrierFilterBar: React.FC<CarrierFilterBarProps> = ({
  carrierFilter,
  onCarrierFilterChange,
  onQuickSelect,
  availableCarriers,
  rateCount
}) => {
  const carrierOptions = [
    { value: 'all', label: 'All Carriers' },
    { value: 'ups', label: 'UPS' },
    { value: 'usps', label: 'USPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dhl', label: 'DHL' }
  ].filter(option => 
    option.value === 'all' || availableCarriers.includes(option.value)
  );

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filter & Quick Select</h3>
          <Badge variant="outline" className="text-sm">
            {rateCount} rates
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Carrier Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Carrier Filter</label>
          <Select value={carrierFilter} onValueChange={onCarrierFilterChange}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select carrier" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {carrierOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Select Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Quick Select</label>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickSelect('cheapest')}
              className="flex-1"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              Cheapest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickSelect('fastest')}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-1" />
              Fastest
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickSelect('balanced')}
              className="flex-1"
            >
              <Target className="w-4 h-4 mr-1" />
              Balanced
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarrierFilterBar;

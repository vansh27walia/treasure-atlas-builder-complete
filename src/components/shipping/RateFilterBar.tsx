
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Zap, DollarSign, Clock, Shield, Truck } from 'lucide-react';

interface RateFilterBarProps {
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
}

const RateFilterBar: React.FC<RateFilterBarProps> = ({ onFilterChange, selectedFilter }) => {
  const quickFilters = [
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, color: 'bg-green-500' },
    { id: 'fastest', label: 'Fastest', icon: Zap, color: 'bg-blue-500' },
    { id: 'reliable', label: 'Most Reliable', icon: Shield, color: 'bg-purple-500' },
  ];

  const allFilters = [
    'cheapest', 'fastest', 'reliable', 'door-delivery', 'po-box', 'eco-friendly',
    '2-day', 'express', 'bulk', 'international', 'return-friendly', 'weekend',
    'signature-required', 'insurance-included', 'tracking-premium', 'overnight',
    'ground', 'priority', 'standard', 'economy'
  ];

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter Shipping Options</h3>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-4">
        {quickFilters.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            onClick={() => onFilterChange(filter.id)}
            className={`flex items-center gap-2 ${
              selectedFilter === filter.id 
                ? `${filter.color} text-white hover:opacity-90` 
                : 'hover:bg-gray-50'
            }`}
          >
            <filter.icon className="w-4 h-4" />
            {filter.label}
          </Button>
        ))}
      </div>

      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="More filter options..." />
        </SelectTrigger>
        <SelectContent>
          {allFilters.map((filter) => (
            <SelectItem key={filter} value={filter}>
              {filter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RateFilterBar;

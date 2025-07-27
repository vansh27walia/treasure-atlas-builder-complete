
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface RateFilterProps {
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
}

const RateFilter: React.FC<RateFilterProps> = ({ onFilterChange, selectedFilter }) => {
  const filterOptions = [
    { value: 'all', label: 'All Carriers' },
    { value: 'fastest', label: 'Fastest First' },
    { value: 'cheapest', label: 'Cheapest First' },
    { value: 'ups', label: 'UPS Only' },
    { value: 'usps', label: 'USPS Only' },
    { value: 'fedex', label: 'FedEx Only' },
    { value: 'recommended', label: 'AI Recommended' }
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      <Filter className="w-4 h-4 text-gray-600" />
      <Select value={selectedFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter rates..." />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg z-50">
          {filterOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RateFilter;


import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter, Zap, DollarSign, Clock, Shield, Star } from 'lucide-react';

interface RateFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const RateFilter: React.FC<RateFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All Rates', icon: Filter },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign },
    { id: 'fastest', label: 'Fastest', icon: Zap },
    { id: 'balanced', label: 'Most Efficient', icon: Clock },
    { id: 'most-reliable', label: 'Most Reliable', icon: Shield },
    { id: 'ai-recommended', label: 'AI Recommended', icon: Star }
  ];

  const selectedFilter = filters.find(f => f.id === activeFilter);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter Rates</h3>
      </div>
      
      <div className="flex items-center gap-3">
        <Select value={activeFilter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-64 bg-white">
            <SelectValue>
              <div className="flex items-center gap-2">
                {selectedFilter && (
                  <>
                    <selectedFilter.icon className="w-4 h-4" />
                    {selectedFilter.label}
                  </>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <SelectItem key={filter.id} value={filter.id} className="hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {activeFilter !== 'all' && (
          <Badge className="bg-blue-500 text-white">
            Active Filter
          </Badge>
        )}
      </div>
    </div>
  );
};

export default RateFilter;

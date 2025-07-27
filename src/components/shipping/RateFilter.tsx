
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Zap, DollarSign, Clock, Shield, Star } from 'lucide-react';

interface RateFilterProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const RateFilter: React.FC<RateFilterProps> = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'All Rates', icon: Filter, color: 'bg-gray-100 text-gray-800' },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, color: 'bg-green-100 text-green-800' },
    { id: 'fastest', label: 'Fastest', icon: Zap, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'balanced', label: 'Most Efficient', icon: Clock, color: 'bg-blue-100 text-blue-800' },
    { id: 'most-reliable', label: 'Most Reliable', icon: Shield, color: 'bg-purple-100 text-purple-800' },
    { id: 'ai-recommended', label: 'AI Recommended', icon: Star, color: 'bg-pink-100 text-pink-800' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter Rates</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange(filter.id)}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'hover:bg-gray-50 border-gray-300'
              }`}
            >
              <Icon className="w-3 h-3" />
              {filter.label}
              {isActive && (
                <Badge className="ml-1 bg-blue-500 text-white text-xs">
                  Active
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default RateFilter;

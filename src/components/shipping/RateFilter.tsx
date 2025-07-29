
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
    <div className="flex gap-2">
        <Select
          value={sortField}
          onValueChange={(value) => onSortChange(value as 'recipient' | 'rate' | 'carrier', sortDirection)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort by</SelectLabel>
              <SelectItem value="recipient">Recipient</SelectItem>
              <SelectItem value="rate">Price</SelectItem>
              <SelectItem value="carrier">Carrier</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
          className="border"
        >
          {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter by carrier</h4>
              
              <RadioGroup 
                value={selectedCarrier || ''} 
                onValueChange={(value) => onCarrierFilterChange(value === '' ? null : value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="all" />
                  <Label htmlFor="all">All carriers</Label>
                </div>
                
                {EXTENDED_CARRIER_OPTIONS.map((carrier) => (
                  <div className="flex items-center space-x-2" key={carrier.id}>
                    <RadioGroupItem value={carrier.id} id={carrier.id} />
                    <Label htmlFor={carrier.id}>{carrier.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </PopoverContent>
        </Popover>
      </div>
  );
};

export default RateFilter;

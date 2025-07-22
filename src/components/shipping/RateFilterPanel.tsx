
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Zap, DollarSign, Leaf, Clock, Brain, Filter } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

interface RateFilterPanelProps {
  onSortChange: (sort: string) => void;
  onCarrierFilter: (carriers: string[]) => void;
  onAIFilter: (filter: string) => void;
  availableCarriers: string[];
  selectedCarriers: string[];
  currentSort: string;
  currentAIFilter: string;
}

const RateFilterPanel: React.FC<RateFilterPanelProps> = ({
  onSortChange,
  onCarrierFilter,
  onAIFilter,
  availableCarriers,
  selectedCarriers,
  currentSort,
  currentAIFilter
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const aiFilters = [
    { id: 'recommended', label: 'AI Recommended', icon: Brain, color: 'bg-purple-100 text-purple-800 border-purple-300' },
    { id: 'fastest', label: 'Fastest', icon: Zap, color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, color: 'bg-green-100 text-green-800 border-green-300' },
    { id: 'eco-friendly', label: 'Eco-Friendly', icon: Leaf, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'reliable', label: 'Most Reliable', icon: Clock, color: 'bg-orange-100 text-orange-800 border-orange-300' }
  ];

  const handleCarrierToggle = (carrier: string) => {
    const updated = selectedCarriers.includes(carrier)
      ? selectedCarriers.filter(c => c !== carrier)
      : [...selectedCarriers, carrier];
    onCarrierFilter(updated);
  };

  return (
    <Card className="p-4 mb-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Rate Filters & AI Optimization</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <span>{isExpanded ? 'Less' : 'More'} Options</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Quick AI Filters - Always Visible */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Quick AI Optimization</h4>
        <div className="flex flex-wrap gap-2">
          {aiFilters.slice(0, 3).map((filter) => {
            const Icon = filter.icon;
            const isActive = currentAIFilter === filter.id;
            return (
              <Badge
                key={filter.id}
                variant={isActive ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  isActive ? 'bg-blue-600 text-white border-blue-600' : filter.color
                } hover:scale-105`}
                onClick={() => onAIFilter(filter.id)}
              >
                <Icon className="w-3 h-3 mr-1" />
                {filter.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Expanded Options */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Sort Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
            <Select value={currentSort} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheapest">Cheapest → Expensive</SelectItem>
                <SelectItem value="expensive">Expensive → Cheapest</SelectItem>
                <SelectItem value="fastest">Fastest → Slowest</SelectItem>
                <SelectItem value="slowest">Slowest → Fastest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Carrier Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filter by Carrier</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCarriers.length === availableCarriers.length ? "default" : "outline"}
                size="sm"
                onClick={() => onCarrierFilter(availableCarriers)}
                className="text-xs"
              >
                Select All
              </Button>
              {availableCarriers.map((carrier) => (
                <Button
                  key={carrier}
                  variant={selectedCarriers.includes(carrier) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCarrierToggle(carrier)}
                  className="flex items-center space-x-2"
                >
                  <CarrierLogo carrier={carrier} className="w-4 h-4" />
                  <span className="text-xs">{carrier}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Advanced AI Filters */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Advanced AI Optimization</h4>
            <div className="flex flex-wrap gap-2">
              {aiFilters.slice(3).map((filter) => {
                const Icon = filter.icon;
                const isActive = currentAIFilter === filter.id;
                return (
                  <Badge
                    key={filter.id}
                    variant={isActive ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      isActive ? 'bg-blue-600 text-white border-blue-600' : filter.color
                    } hover:scale-105`}
                    onClick={() => onAIFilter(filter.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {filter.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default RateFilterPanel;

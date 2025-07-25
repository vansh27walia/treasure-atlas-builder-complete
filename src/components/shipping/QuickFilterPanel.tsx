
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Clock, 
  Target, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle 
} from 'lucide-react';

interface QuickFilterPanelProps {
  onFilterSelect: (filter: string) => void;
  selectedFilter: string;
}

const filterOptions = [
  {
    id: 'cheapest',
    label: 'Most Cheapest',
    description: 'Lowest cost option',
    icon: DollarSign,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  {
    id: 'fastest',
    label: 'Most Fastest',
    description: 'Quickest delivery',
    icon: Zap,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'efficient',
    label: 'Most Efficient',
    description: 'Best value balance',
    icon: Target,
    color: 'bg-purple-500',
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50'
  },
  {
    id: 'reliable',
    label: 'Most Reliable',
    description: 'Trusted carriers',
    icon: Shield,
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50'
  }
];

const QuickFilterPanel: React.FC<QuickFilterPanelProps> = ({
  onFilterSelect,
  selectedFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterClick = (filterId: string) => {
    onFilterSelect(filterId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        Quick Filter
        {selectedFilter && (
          <Badge variant="secondary" className="ml-2">
            {filterOptions.find(f => f.id === selectedFilter)?.label}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-12 left-0 w-80 z-50 p-4 shadow-xl border-2">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Rate Filters</h3>
            
            {filterOptions.map((filter) => (
              <div
                key={filter.id}
                onClick={() => handleFilterClick(filter.id)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedFilter === filter.id 
                    ? `${filter.bgColor} border-2 border-current ${filter.textColor}` 
                    : 'hover:bg-gray-50 border-2 border-transparent'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-full ${filter.color} flex items-center justify-center`}>
                  <filter.icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{filter.label}</div>
                  <div className="text-sm text-gray-600">{filter.description}</div>
                </div>
                
                {selectedFilter === filter.id && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuickFilterPanel;

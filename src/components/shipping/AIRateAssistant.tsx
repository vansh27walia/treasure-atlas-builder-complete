import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, DollarSign, Shield, Star, Truck, Crown } from 'lucide-react';

interface AIRateAssistantProps {
  rates: any[];
  onSort: (criteria: string) => void;
  activeCriteria?: string;
}

const sortingOptions = [
  {
    id: 'fastest',
    label: 'Fastest',
    icon: Zap,
    description: 'Shortest delivery time',
    color: 'bg-red-500'
  },
  {
    id: 'cheapest',
    label: 'Cheapest',
    icon: DollarSign,
    description: 'Lowest price',
    color: 'bg-green-500'
  },
  {
    id: 'reliable',
    label: 'Most Reliable',
    icon: Shield,
    description: 'Best track record',
    color: 'bg-blue-500'
  },
  {
    id: 'balanced',
    label: 'Best Value',
    icon: Star,
    description: 'Best price/speed ratio',
    color: 'bg-purple-500'
  },
  {
    id: 'premium',
    label: 'Premium',
    icon: Crown,
    description: 'Premium services',
    color: 'bg-amber-500'
  },
];

const AIRateAssistant: React.FC<AIRateAssistantProps> = ({
  rates,
  onSort,
  activeCriteria
}) => {
  if (rates.length === 0) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-blue-900">AI Rate Assistant</h3>
          <p className="text-sm text-blue-700">Select the best option for your needs</p>
        </div>
        <div className="text-right">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            TIPS
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {sortingOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeCriteria === option.id;
          
          return (
            <Button
              key={option.id}
              variant={isActive ? "default" : "outline"}
              onClick={() => onSort(option.id)}
              className={`flex flex-col items-center p-3 h-auto space-y-2 text-xs ${
                isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-blue-50 border-blue-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{option.label}</span>
              <span className="opacity-80 text-center leading-tight">
                {option.description}
              </span>
            </Button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Need help choosing? Use our chat assistant below for personalized recommendations!
        </p>
      </div>
    </Card>
  );
};

export default AIRateAssistant;
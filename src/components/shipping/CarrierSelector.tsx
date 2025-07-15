
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck } from 'lucide-react';

interface CarrierSelectorProps {
  selectedCarriers: string[];
  onCarrierChange: (carriers: string[]) => void;
}

const carriers = [
  { 
    id: 'usps', 
    name: 'USPS', 
    color: 'bg-blue-600',
    logo: '📮'
  },
  { 
    id: 'ups', 
    name: 'UPS', 
    color: 'bg-amber-600',
    logo: '📦'
  },
  { 
    id: 'fedex', 
    name: 'FedEx', 
    color: 'bg-purple-600',
    logo: '✈️'
  },
  { 
    id: 'dhl', 
    name: 'DHL', 
    color: 'bg-yellow-500',
    logo: '🚚'
  }
];

const CarrierSelector: React.FC<CarrierSelectorProps> = ({
  selectedCarriers,
  onCarrierChange,
}) => {
  const handleCarrierToggle = (carrierId: string) => {
    if (selectedCarriers.includes(carrierId)) {
      onCarrierChange(selectedCarriers.filter(id => id !== carrierId));
    } else {
      onCarrierChange([...selectedCarriers, carrierId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCarriers.length === carriers.length) {
      onCarrierChange([]);
    } else {
      onCarrierChange(carriers.map(c => c.id));
    }
  };

  return (
    <Card className="border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">Filter by Carrier</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs h-6 px-2"
          >
            {selectedCarriers.length === carriers.length ? 'Clear All' : 'Select All'}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {carriers.map((carrier) => {
            const isSelected = selectedCarriers.includes(carrier.id);
            return (
              <button
                key={carrier.id}
                onClick={() => handleCarrierToggle(carrier.id)}
                className={`
                  flex items-center gap-2 p-2 rounded-lg border transition-all text-left
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="text-lg">{carrier.logo}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{carrier.name}</div>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs mt-1 bg-blue-100 text-blue-700">
                      Active
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {selectedCarriers.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-gray-600">
              Filtering by: {selectedCarriers.map(id => 
                carriers.find(c => c.id === id)?.name
              ).join(', ')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarrierSelector;


import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
    description: 'US Postal Service'
  },
  { 
    id: 'ups', 
    name: 'UPS', 
    color: 'bg-yellow-600',
    description: 'United Parcel Service'
  },
  { 
    id: 'fedex', 
    name: 'FedEx', 
    color: 'bg-purple-600',
    description: 'Federal Express'
  },
  { 
    id: 'dhl', 
    name: 'DHL', 
    color: 'bg-red-600',
    description: 'DHL Express'
  }
];

const CarrierSelector: React.FC<CarrierSelectorProps> = ({
  selectedCarriers,
  onCarrierChange,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedCarriers);

  const handleCarrierToggle = (carrierId: string) => {
    const newSelected = selected.includes(carrierId)
      ? selected.filter(id => id !== carrierId)
      : [...selected, carrierId];
    
    setSelected(newSelected);
    onCarrierChange(newSelected);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Truck className="w-4 h-4" />
        Select Carriers
      </Label>
      
      <div className="space-y-2">
        {carriers.map((carrier) => (
          <div key={carrier.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
            <Checkbox
              id={carrier.id}
              checked={selected.includes(carrier.id)}
              onCheckedChange={() => handleCarrierToggle(carrier.id)}
            />
            
            <div className="flex items-center gap-2 flex-1">
              <div className={`w-4 h-4 rounded ${carrier.color} flex items-center justify-center`}>
                <Truck className="w-2 h-2 text-white" />
              </div>
              
              <div className="flex-1">
                <Label htmlFor={carrier.id} className="text-sm font-medium cursor-pointer">
                  {carrier.name}
                </Label>
                <p className="text-xs text-gray-500">{carrier.description}</p>
              </div>
              
              {selected.includes(carrier.id) && (
                <Badge variant="secondary" className="text-xs">
                  Selected
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selected.length > 0 && (
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            {selected.length} carrier{selected.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default CarrierSelector;

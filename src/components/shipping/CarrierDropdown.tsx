
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import CarrierLogo from './CarrierLogo';

interface CarrierDropdownProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
  availableCarriers?: string[];
}

const carriers = [
  { id: 'all', name: 'All Carriers' },
  { id: 'usps', name: 'USPS' },
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'dhl', name: 'DHL' }
];

const CarrierDropdown: React.FC<CarrierDropdownProps> = ({
  selectedCarrier,
  onCarrierChange,
  availableCarriers
}) => {
  const filteredCarriers = availableCarriers 
    ? carriers.filter(c => c.id === 'all' || availableCarriers.includes(c.id))
    : carriers;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Filter by Carrier</Label>
      <Select value={selectedCarrier} onValueChange={onCarrierChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select carrier" />
        </SelectTrigger>
        <SelectContent>
          {filteredCarriers.map((carrier) => (
            <SelectItem key={carrier.id} value={carrier.id}>
              <div className="flex items-center gap-2">
                {carrier.id !== 'all' && (
                  <CarrierLogo carrier={carrier.name} size="sm" />
                )}
                <span>{carrier.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarrierDropdown;

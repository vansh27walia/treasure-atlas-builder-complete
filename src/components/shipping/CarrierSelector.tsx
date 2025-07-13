
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';

interface CarrierSelectorProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
}

const CarrierSelector: React.FC<CarrierSelectorProps> = ({
  selectedCarrier,
  onCarrierChange,
}) => {
  const carriers = [
    { value: 'all', label: 'All Carriers' },
    { value: 'usps', label: 'USPS' },
    { value: 'ups', label: 'UPS' },
    { value: 'fedex', label: 'FedEx' },
    { value: 'dhl', label: 'DHL' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Truck className="h-4 w-4" />
        Carrier
      </Label>
      <Select value={selectedCarrier} onValueChange={onCarrierChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select carrier" />
        </SelectTrigger>
        <SelectContent>
          {carriers.map((carrier) => (
            <SelectItem key={carrier.value} value={carrier.value}>
              {carrier.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarrierSelector;

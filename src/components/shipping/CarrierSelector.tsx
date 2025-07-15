
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CarrierSelectorProps {
  selectedCarriers: string[];
  onCarrierChange: (carriers: string[]) => void;
}

const carriers = [
  { value: 'usps', label: 'USPS', logo: '🇺🇸' },
  { value: 'fedex', label: 'FedEx', logo: '📦' },
  { value: 'ups', label: 'UPS', logo: '🚛' },
  { value: 'dhl', label: 'DHL', logo: '✈️' },
];

const CarrierSelector: React.FC<CarrierSelectorProps> = ({
  selectedCarriers,
  onCarrierChange,
}) => {
  const handleCarrierSelect = (carrierValue: string) => {
    if (carrierValue === 'all') {
      onCarrierChange(['usps', 'fedex', 'ups', 'dhl']);
    } else {
      onCarrierChange([carrierValue]);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Preferred Carrier</Label>
      <Select onValueChange={handleCarrierSelect} defaultValue="all">
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select carrier" />
        </SelectTrigger>
        <SelectContent className="bg-white border shadow-lg">
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <span>🌐</span>
              <span>All Carriers</span>
            </div>
          </SelectItem>
          {carriers.map((carrier) => (
            <SelectItem key={carrier.value} value={carrier.value}>
              <div className="flex items-center gap-2">
                <span>{carrier.logo}</span>
                <span>{carrier.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarrierSelector;

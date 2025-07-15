
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CarrierLogo from './CarrierLogo';

interface CarrierDropdownProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
  availableCarriers: string[];
}

const CarrierDropdown: React.FC<CarrierDropdownProps> = ({
  selectedCarrier,
  onCarrierChange,
  availableCarriers
}) => {
  const carriers = [
    { code: 'all', name: 'All Carriers' },
    { code: 'usps', name: 'USPS' },
    { code: 'ups', name: 'UPS' },
    { code: 'fedex', name: 'FedEx' },
    { code: 'dhl', name: 'DHL' }
  ];

  return (
    <Select value={selectedCarrier} onValueChange={onCarrierChange}>
      <SelectTrigger className="w-48 border border-blue-200 hover:bg-blue-50 bg-white">
        <SelectValue placeholder="Select Carrier" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-blue-200 shadow-lg z-[9999]">
        {carriers.map((carrier) => (
          <SelectItem 
            key={carrier.code} 
            value={carrier.code}
            className="py-3 cursor-pointer hover:bg-blue-50"
          >
            <div className="flex items-center gap-3">
              {carrier.code !== 'all' && (
                <CarrierLogo carrier={carrier.code} size="sm" />
              )}
              <span className="font-medium">{carrier.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CarrierDropdown;

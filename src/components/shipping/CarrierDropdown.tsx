
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CarrierLogo from './CarrierLogo';

interface CarrierDropdownProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
  availableCarriers?: string[];
}

const CarrierDropdown: React.FC<CarrierDropdownProps> = ({
  selectedCarrier,
  onCarrierChange,
  availableCarriers = []
}) => {
  // Only main carriers
  const carriers = [
    { code: 'all', name: 'All Carriers' },
    { code: 'ups', name: 'UPS' },
    { code: 'usps', name: 'USPS' },
    { code: 'fedex', name: 'FedEx' },
    { code: 'dhl', name: 'DHL' }
  ];

  return (
    <Select value={selectedCarrier} onValueChange={onCarrierChange}>
      <SelectTrigger className="w-64 border border-blue-200 hover:bg-blue-50">
        <SelectValue placeholder="Select Carrier" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-blue-200 shadow-lg z-[9999] w-64">
        {carriers.map((carrier) => (
          <SelectItem 
            key={carrier.code} 
            value={carrier.code}
            className="py-3 cursor-pointer hover:bg-blue-50 w-full"
          >
            <div className="flex items-center gap-3 w-full">
              {carrier.code !== 'all' && (
                <CarrierLogo carrier={carrier.code} className="h-6 w-auto" />
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

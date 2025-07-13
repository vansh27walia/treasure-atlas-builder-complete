
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';

interface CarrierSelectorProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
}

const CarrierSelector: React.FC<CarrierSelectorProps> = ({ selectedCarrier, onCarrierChange }) => {
  const carriers = [
    { value: 'all', label: 'All Carriers', icon: '📦' },
    { value: 'usps', label: 'USPS', icon: '🇺🇸' },
    { value: 'ups', label: 'UPS', icon: '🤎' },
    { value: 'fedex', label: 'FedEx', icon: '💜' },
    { value: 'dhl', label: 'DHL', icon: '🟡' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center mb-3">
        <Truck className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Preferred Carrier</h3>
      </div>
      
      <Select value={selectedCarrier} onValueChange={onCarrierChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select carrier preference" />
        </SelectTrigger>
        <SelectContent>
          {carriers.map((carrier) => (
            <SelectItem key={carrier.value} value={carrier.value}>
              <div className="flex items-center">
                <span className="mr-2">{carrier.icon}</span>
                {carrier.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarrierSelector;

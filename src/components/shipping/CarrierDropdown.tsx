
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck } from 'lucide-react';

interface CarrierOption {
  value: string;
  label: string;
  logo: string;
  color: string;
  description: string;
}

interface CarrierDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
}

const carriers: CarrierOption[] = [
  { 
    value: 'all', 
    label: 'All Carriers', 
    logo: '📦',
    color: 'bg-gradient-to-r from-blue-500 to-purple-500',
    description: 'Compare all available options'
  },
  { 
    value: 'usps', 
    label: 'USPS', 
    logo: '🇺🇸',
    color: 'bg-gradient-to-r from-red-500 to-blue-500',
    description: 'US Postal Service'
  },
  { 
    value: 'ups', 
    label: 'UPS', 
    logo: '🤎',
    color: 'bg-gradient-to-r from-yellow-600 to-yellow-800',
    description: 'United Parcel Service'
  },
  { 
    value: 'fedex', 
    label: 'FedEx', 
    logo: '💜',
    color: 'bg-gradient-to-r from-purple-600 to-orange-500',
    description: 'Federal Express'
  },
  { 
    value: 'dhl', 
    label: 'DHL', 
    logo: '🟡',
    color: 'bg-gradient-to-r from-yellow-400 to-red-500',
    description: 'International Express'
  },
];

const CarrierDropdown: React.FC<CarrierDropdownProps> = ({ value, onValueChange }) => {
  const selectedCarrier = carriers.find(c => c.value === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900 flex items-center">
        <Truck className="w-4 h-4 mr-2 text-blue-600" />
        Preferred Carrier
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full h-14 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 rounded-xl shadow-sm">
          <SelectValue>
            {selectedCarrier && (
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl ${selectedCarrier.color} flex items-center justify-center shadow-md`}>
                  <span className="text-xl">{selectedCarrier.logo}</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{selectedCarrier.label}</div>
                  <div className="text-xs text-gray-500">{selectedCarrier.description}</div>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl">
          {carriers.map((carrier) => (
            <SelectItem 
              key={carrier.value} 
              value={carrier.value}
              className="p-4 rounded-lg hover:bg-blue-50 cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl ${carrier.color} flex items-center justify-center shadow-md`}>
                  <span className="text-2xl">{carrier.logo}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{carrier.label}</div>
                  <div className="text-sm text-gray-500">{carrier.description}</div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CarrierDropdown;

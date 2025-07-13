
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CarrierSelectorProps {
  selectedCarrier: string;
  onCarrierChange: (carrier: string) => void;
}

const carriers = [
  { 
    value: 'all', 
    label: 'All Carriers', 
    logo: '📦',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    description: 'Compare all options'
  },
  { 
    value: 'usps', 
    label: 'USPS', 
    logo: '🇺🇸',
    color: 'bg-red-50 border-red-200 text-red-700',
    description: 'US Postal Service'
  },
  { 
    value: 'ups', 
    label: 'UPS', 
    logo: '🤎',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    description: 'United Parcel Service'
  },
  { 
    value: 'fedex', 
    label: 'FedEx', 
    logo: '💜',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    description: 'Federal Express'
  },
  { 
    value: 'dhl', 
    label: 'DHL', 
    logo: '🟡',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    description: 'International Express'
  },
];

const CarrierSelector: React.FC<CarrierSelectorProps> = ({ selectedCarrier, onCarrierChange }) => {
  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Carrier</h3>
        <p className="text-sm text-gray-600">Choose your preferred shipping carrier</p>
      </div>
      
      <div className="space-y-3">
        {carriers.map((carrier) => (
          <div
            key={carrier.value}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
              selectedCarrier === carrier.value 
                ? `${carrier.color} border-current shadow-md` 
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            onClick={() => onCarrierChange(carrier.value)}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{carrier.logo}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-semibold ${
                    selectedCarrier === carrier.value ? 'text-current' : 'text-gray-900'
                  }`}>
                    {carrier.label}
                  </h4>
                  {selectedCarrier === carrier.value && (
                    <Badge variant="secondary" className="ml-2">Selected</Badge>
                  )}
                </div>
                <p className={`text-sm ${
                  selectedCarrier === carrier.value ? 'text-current opacity-80' : 'text-gray-500'
                }`}>
                  {carrier.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CarrierSelector;


import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp, Clock, Download, Truck } from 'lucide-react';
import CarrierLogo from './CarrierLogo';
import { Badge } from '@/components/ui/badge';

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  list_rate?: string;
  delivery_days?: number;
  delivery_date?: string;
  ship_date?: string;
  shipment_id?: string;
  original_rate?: string;
}

interface ShippingRateDropdownProps {
  rates: ShippingRate[];
  selectedRateId: string | null;
  onSelectRate: (rateId: string) => void;
  bestValueRateId?: string;
  fastestRateId?: string;
  isLoading?: boolean;
  onCreateLabel?: () => void;
}

const ShippingRateDropdown: React.FC<ShippingRateDropdownProps> = ({
  rates,
  selectedRateId,
  onSelectRate,
  bestValueRateId,
  fastestRateId,
  isLoading,
  onCreateLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the selected rate
  const selectedRate = rates.find(r => r.id === selectedRateId) || rates[0];
  
  // Sort rates by price
  const sortedRates = [...rates].sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

  return (
    <div className="w-full">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline" 
            className={`w-full justify-between border-2 p-3 h-auto ${selectedRateId ? 'border-purple-300' : 'border-gray-200'}`}
          >
            {selectedRate ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <CarrierLogo carrier={selectedRate.carrier} />
                  <div className="text-left">
                    <p className="font-medium">{selectedRate.carrier.toUpperCase()} - {selectedRate.service}</p>
                    <p className="text-sm text-gray-500">
                      {selectedRate.delivery_date || (selectedRate.delivery_days ? `${selectedRate.delivery_days} days` : '3-5 days')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-purple-700">${selectedRate.rate}</span>
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span>Select a shipping option</span>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="max-h-80 overflow-y-auto">
            {sortedRates.map((rate) => (
              <div 
                key={rate.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedRateId === rate.id
                    ? 'bg-purple-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  onSelectRate(rate.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CarrierLogo carrier={rate.carrier} size="sm" />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-medium">{rate.carrier.toUpperCase()} - {rate.service}</p>
                        {bestValueRateId === rate.id && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-xs">
                            Best Value
                          </Badge>
                        )}
                        {fastestRateId === rate.id && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
                            Fastest
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {rate.delivery_date || (rate.delivery_days ? `${rate.delivery_days} days` : '3-5 days')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-base font-bold text-purple-700">${rate.rate}</p>
                      {rate.list_rate && rate.list_rate !== rate.rate && (
                        <p className="text-xs text-gray-500 line-through">${rate.list_rate}</p>
                      )}
                    </div>
                    {selectedRateId === rate.id && <Check className="h-5 w-5 text-purple-600" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedRateId && onCreateLabel && (
            <div className="p-3 border-t">
              <Button 
                onClick={onCreateLabel}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Continue with Selected Rate
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ShippingRateDropdown;

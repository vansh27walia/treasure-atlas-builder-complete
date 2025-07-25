
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CarrierLogo from './CarrierLogo';
import { Clock, DollarSign, Shield, TrendingUp } from 'lucide-react';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date: string;
}

interface RateDisplayWithLogosProps {
  rates: Rate[];
  onCarrierFilter: (carrier: string) => void;
  onSortChange: (sort: string) => void;
  selectedCarrier: string;
  selectedSort: string;
}

const RateDisplayWithLogos: React.FC<RateDisplayWithLogosProps> = ({
  rates,
  onCarrierFilter,
  onSortChange,
  selectedCarrier,
  selectedSort
}) => {
  // Get unique carriers from rates
  const uniqueCarriers = [...new Set(rates.map(rate => rate.carrier.toUpperCase()))];

  return (
    <div className="space-y-4">
      {/* Carrier Logos Row */}
      {uniqueCarriers.length > 0 && (
        <div className="flex items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Available Carriers:</span>
          {uniqueCarriers.map((carrier) => (
            <div key={carrier} className="flex flex-col items-center gap-1">
              <CarrierLogo carrier={carrier} className="w-8 h-8" />
              <span className="text-xs text-gray-600">{carrier}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <Select value={selectedCarrier} onValueChange={onCarrierFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Carriers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {uniqueCarriers.map((carrier) => (
                <SelectItem key={carrier} value={carrier.toLowerCase()}>
                  <div className="flex items-center gap-2">
                    <CarrierLogo carrier={carrier} className="w-4 h-4" />
                    {carrier}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <Select value={selectedSort} onValueChange={onSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Best Match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cheapest">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cheapest
                </div>
              </SelectItem>
              <SelectItem value="fastest">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fastest
                </div>
              </SelectItem>
              <SelectItem value="efficient">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Most Efficient
                </div>
              </SelectItem>
              <SelectItem value="reliable">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Most Reliable
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rate Results */}
      <div className="space-y-3">
        {rates.map((rate) => (
          <Card key={rate.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CarrierLogo carrier={rate.carrier} className="w-10 h-10" />
                <div>
                  <div className="font-medium text-gray-900">{rate.service}</div>
                  <div className="text-sm text-gray-600">{rate.carrier}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">${rate.rate}</div>
                  <div className="text-sm text-gray-600">{rate.delivery_days} days</div>
                </div>
                
                <Badge variant="outline" className="text-xs">
                  {rate.delivery_date}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RateDisplayWithLogos;

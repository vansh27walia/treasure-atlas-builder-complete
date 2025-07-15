
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Crown } from 'lucide-react';
import { ShippingRate } from '@/hooks/useShippingRates';

interface RateDropdownSelectorProps {
  rates: ShippingRate[];
  onRateSelect: (rateId: string) => void;
  onRatesReorder: (rates: ShippingRate[]) => void;
  selectedAiMetric?: string;
}

const RateDropdownSelector: React.FC<RateDropdownSelectorProps> = ({
  rates,
  onRateSelect,
  onRatesReorder,
  selectedAiMetric
}) => {
  const [selectedRateId, setSelectedRateId] = useState<string>('');

  const handleRateSelection = (rateId: string) => {
    setSelectedRateId(rateId);
    onRateSelect(rateId);
  };

  const getAiChosenRate = () => {
    if (selectedAiMetric && rates.length > 0) {
      return rates[0]; // Assuming first rate is AI chosen after reordering
    }
    return null;
  };

  const aiChosenRate = getAiChosenRate();

  return (
    <div className="space-y-4">
      {aiChosenRate && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">AI Recommended</span>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {selectedAiMetric}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{aiChosenRate.carrier} - {aiChosenRate.service}</p>
              <p className="text-sm text-gray-600">
                {aiChosenRate.delivery_days ? `${aiChosenRate.delivery_days} business days` : 'See carrier for delivery time'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">${aiChosenRate.rate}</p>
              {aiChosenRate.total_cost && (
                <p className="text-sm text-gray-600">
                  Total: ${aiChosenRate.total_cost.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Rate Option
        </label>
        <Select onValueChange={handleRateSelection} value={selectedRateId || ''}>
          <SelectTrigger className="w-full h-12 bg-white border-2 border-gray-200">
            <SelectValue placeholder="Choose a shipping rate" />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gray-200 shadow-lg max-h-80">
            {rates.map((rate) => (
              <SelectItem key={rate.id} value={rate.id} className="py-3">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{rate.carrier} - {rate.service}</div>
                    <div className="text-sm text-gray-600">
                      {rate.delivery_days ? `${rate.delivery_days} business days` : 'See carrier for timing'}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-bold">${rate.rate}</div>
                    {rate.total_cost && (
                      <div className="text-sm text-gray-600">
                        Total: ${rate.total_cost.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RateDropdownSelector;


import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rate } from '@/types/shipping';

interface BulkRateDisplayProps {
  rates: Rate[];
  selectedRateId: string;
  onSelectRate: (rateId: string) => void;
  isFetching: boolean;
}

const BulkRateDisplay: React.FC<BulkRateDisplayProps> = ({
  rates,
  selectedRateId,
  onSelectRate,
  isFetching
}) => {
  if (!rates || rates.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        No rates available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rates.map((rate) => {
        const rateValue = typeof rate.rate === 'string' ? parseFloat(rate.rate) : rate.rate;
        const isSelected = rate.id === selectedRateId;
        
        return (
          <div
            key={rate.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectRate(rate.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{rate.carrier} - {rate.service}</span>
                {rate.delivery_days && (
                  <Badge variant="outline" className="text-xs">
                    {rate.delivery_days} days
                  </Badge>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ${rateValue ? rateValue.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
            
            {isSelected && (
              <div className="mt-2 text-xs text-green-600 font-medium">
                ✓ Selected
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BulkRateDisplay;

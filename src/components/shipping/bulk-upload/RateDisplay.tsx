
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RateDisplayProps {
  actualRate: string | number;
  carrier: string;
  service: string;
  deliveryDays?: number;
}

const RateDisplay: React.FC<RateDisplayProps> = ({
  actualRate,
  carrier,
  service,
  deliveryDays
}) => {
  const rate = typeof actualRate === 'string' ? parseFloat(actualRate) : actualRate;
  const inflatedRate = rate * 4; // 300% higher (showing 75% savings)
  const savings = Math.round(((inflatedRate - rate) / inflatedRate) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{carrier} - {service}</span>
        {deliveryDays && (
          <Badge variant="outline" className="text-xs">
            {deliveryDays} days
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-xs text-gray-500 line-through">
            ${inflatedRate.toFixed(2)}
          </div>
          <div className="text-lg font-bold text-green-600">
            ${rate.toFixed(2)}
          </div>
        </div>
        <div className="text-xs text-green-600 font-medium">
          Save {savings}%
        </div>
      </div>
      
      <div className="text-xs text-gray-600">
        You're saving {savings}% with our negotiated rate
      </div>
    </div>
  );
};

export default RateDisplay;

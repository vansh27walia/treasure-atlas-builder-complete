
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RateDisplayProps {
  actualRate: string | number;
  retailRate?: string | number;
  carrier: string;
  service: string;
  deliveryDays?: number;
}

const RateDisplay: React.FC<RateDisplayProps> = ({
  actualRate,
  retailRate,
  carrier,
  service,
  deliveryDays
}) => {
  const actual = typeof actualRate === 'string' ? parseFloat(actualRate) : actualRate;
  const retail = retailRate ? (typeof retailRate === 'string' ? parseFloat(retailRate) : retailRate) : null;
  
  // Apply 5% markup to actual rate
  const finalPrice = actual * 1.05;
  
  // Calculate savings from retail rate if available
  const savings = retail ? retail - finalPrice : 0;
  const savingsPercent = retail ? Math.round((savings / retail) * 100) : 0;

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
          {retail && (
            <div className="text-xs text-gray-500 line-through">
              Retail Price: ${retail.toFixed(2)}
            </div>
          )}
          <div className="text-lg font-bold text-green-600">
            Final Price: ${finalPrice.toFixed(2)}
          </div>
        </div>
        {savings > 0 && (
          <div className="text-xs text-green-600 font-medium">
            You save ${savings.toFixed(2)} ({savingsPercent}%)
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-600">
        {savings > 0 ? (
          `Based on $${actual.toFixed(2)} EasyPost rate + 5% processing fee`
        ) : (
          `$${actual.toFixed(2)} + 5% processing fee`
        )}
      </div>
    </div>
  );
};

export default RateDisplay;

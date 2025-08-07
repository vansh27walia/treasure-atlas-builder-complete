
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { standardizeCarrierName } from '@/utils/carrierUtils';
import CarrierLogo from '../CarrierLogo';

interface RateDisplayProps {
  actualRate: number | string;
  carrier: string;
  service?: string;
  deliveryDays?: number;
}

const RateDisplay: React.FC<RateDisplayProps> = ({ 
  actualRate, 
  carrier, 
  service, 
  deliveryDays 
}) => {
  const standardizedCarrier = standardizeCarrierName(carrier);
  const rate = typeof actualRate === 'string' ? parseFloat(actualRate) : actualRate;
  
  // Calculate display list rate (inflated for showing savings)
  const displayListRate = rate * 4; // 4x inflation to show ~75% savings
  const savings = Math.round(((displayListRate - rate) / displayListRate) * 100);

  // Only show main carriers
  const allowedCarriers = ['UPS', 'USPS', 'FedEx', 'DHL'];
  if (!allowedCarriers.includes(standardizedCarrier)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <CarrierLogo carrier={standardizedCarrier} className="w-6 h-6" />
        <span className="font-medium text-gray-900">{standardizedCarrier}</span>
        {service && <span className="text-sm text-gray-600">- {service}</span>}
        {deliveryDays && (
          <Badge variant="outline" className="text-xs">
            {deliveryDays} days
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-xs text-gray-500 line-through">
            ${displayListRate.toFixed(2)}
          </div>
          <div className="text-lg font-bold text-green-600">
            ${rate.toFixed(2)}
          </div>
        </div>
        <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
          SAVE {savings}%
        </div>
      </div>
    </div>
  );
};

export default RateDisplay;

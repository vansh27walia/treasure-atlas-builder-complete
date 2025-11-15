
import React from 'react';
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
  const formattedRate = typeof actualRate === 'string' ? parseFloat(actualRate) : actualRate;

  return (
    <div className="flex items-center justify-between space-x-3 p-3 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <CarrierLogo carrier={standardizedCarrier} className="w-8 h-8" />
        <div>
          <div className="font-semibold text-gray-900">
            {standardizedCarrier}
          </div>
          {service && (
            <div className="text-sm text-gray-600">
              {service}
            </div>
          )}
          {deliveryDays && (
            <div className="text-xs text-blue-600 font-medium">
              {deliveryDays} business days
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-green-600">
          ${formattedRate.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default RateDisplay;

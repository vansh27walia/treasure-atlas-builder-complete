
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

  // Calculate mock retail price and discount (54-93% discount range)
  const discountPercentage = Math.floor(Math.random() * 40) + 54; // Random between 54-93
  const mockRetailPrice = formattedRate / (1 - discountPercentage / 100);

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
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-gray-900 line-through decoration-2 decoration-gray-500">
            ${mockRetailPrice.toFixed(2)}
          </span>
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-300">
            {discountPercentage}% OFF
          </span>
        </div>
        <div className="text-xl font-bold text-green-600">
          ${formattedRate.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default RateDisplay;

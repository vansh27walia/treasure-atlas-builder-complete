
import React from 'react';
import { standardizeCarrierName } from '@/utils/carrierUtils';
import CarrierLogo from '../CarrierLogo';

interface RateDisplayProps {
  actualRate: number | string;
  carrier: string;
  service?: string;
  deliveryDays?: number;
}

const RateDisplay: React.FC<RateDisplayProps> = ({ carrier }) => {
  const standardizedCarrier = standardizeCarrierName(carrier);

  return (
    <div className="flex items-center space-x-2">
      <CarrierLogo carrier={standardizedCarrier} className="w-6 h-6" />
      <span className="font-medium text-gray-900">
        {standardizedCarrier}
      </span>
    </div>
  );
};

export default RateDisplay;

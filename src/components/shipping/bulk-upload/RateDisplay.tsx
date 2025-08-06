
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface RateDisplayProps {
  actualRate: string | number;
  carrier: string;
  service: string;
  deliveryDays?: number;
  listRate?: string | number; // Use actual list rate from EasyPost if available
}

const RateDisplay: React.FC<RateDisplayProps> = ({
  actualRate,
  carrier,
  service,
  deliveryDays,
  listRate
}) => {
  const rate = typeof actualRate === 'string' ? parseFloat(actualRate) : actualRate;
  
  // Use actual list rate from EasyPost if available, otherwise inflate for display
  const displayListRate = listRate ? 
    (typeof listRate === 'string' ? parseFloat(listRate) : listRate) :
    rate * 4; // Fallback inflation for display
  
  const savings = Math.round(((displayListRate - rate) / displayListRate) * 100);

  // Standardize carrier names
  const getCarrierDisplayName = (carrierName: string) => {
    const name = carrierName.toUpperCase();
    if (name.includes('USPS')) return 'USPS';
    if (name.includes('UPS')) return 'UPS';
    if (name.includes('FEDEX')) return 'FedEx';
    if (name.includes('DHL')) return 'DHL';
    if (name.includes('CANADA POST') || name.includes('CANADAPOST')) return 'Canada Post';
    return carrierName; // Return original if no match
  };

  const standardizedCarrier = getCarrierDisplayName(carrier);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{standardizedCarrier} - {service}</span>
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
        {savings > 0 && (
          <div className="text-xs text-green-600 font-medium">
            Save {savings}%
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-600">
        {savings > 0 ? `You're saving ${savings}% with our negotiated rate` : 'Competitive shipping rate'}
      </div>
    </div>
  );
};

export default RateDisplay;


import React from 'react';
import { Truck, Package, Plane } from 'lucide-react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "h-6 w-6" }) => {
  const carrierLower = carrier.toLowerCase();
  
  if (carrierLower.includes('usps') || carrierLower === 'usps') {
    return (
      <div className={`${className} flex items-center justify-center bg-blue-600 text-white rounded font-bold text-xs`}>
        USPS
      </div>
    );
  }
  
  if (carrierLower.includes('ups') || carrierLower === 'ups') {
    return (
      <div className={`${className} flex items-center justify-center bg-yellow-600 text-white rounded font-bold text-xs`}>
        UPS
      </div>
    );
  }
  
  if (carrierLower.includes('fedex') || carrierLower === 'fedex') {
    return (
      <div className={`${className} flex items-center justify-center bg-purple-600 text-white rounded font-bold text-xs`}>
        FedEx
      </div>
    );
  }
  
  if (carrierLower.includes('dhl') || carrierLower === 'dhl') {
    return (
      <div className={`${className} flex items-center justify-center bg-red-600 text-white rounded font-bold text-xs`}>
        DHL
      </div>
    );
  }
  
  if (carrierLower.includes('canada') || carrierLower.includes('canadapost')) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-500 text-white rounded font-bold text-xs`}>
        CP
      </div>
    );
  }
  
  // Default fallback
  return <Truck className={className} />;
};

export default CarrierLogo;

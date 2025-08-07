
import React from 'react';
import { Truck, Package, Plane, Ship } from 'lucide-react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-6 h-6" }) => {
  const carrierName = carrier.toUpperCase();

  // Return appropriate logo/icon based on carrier
  if (carrierName.includes('USPS')) {
    return (
      <div className={`${className} flex items-center justify-center bg-blue-600 text-white rounded text-xs font-bold`}>
        USPS
      </div>
    );
  }

  if (carrierName.includes('UPS')) {
    return (
      <div className={`${className} flex items-center justify-center bg-yellow-600 text-white rounded text-xs font-bold`}>
        UPS
      </div>
    );
  }

  if (carrierName.includes('FEDEX')) {
    return (
      <div className={`${className} flex items-center justify-center bg-purple-600 text-white rounded text-xs font-bold`}>
        FDX
      </div>
    );
  }

  if (carrierName.includes('DHL')) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-600 text-white rounded text-xs font-bold`}>
        DHL
      </div>
    );
  }

  if (carrierName.includes('CANADA POST') || carrierName.includes('CANADAPOST')) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-700 text-white rounded text-xs font-bold`}>
        CP
      </div>
    );
  }

  // Default fallback with appropriate icon
  return <Truck className={`${className} text-gray-600`} />;
};

export default CarrierLogo;

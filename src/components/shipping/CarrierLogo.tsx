
import React from 'react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "h-8 w-auto" }) => {
  const carrierLower = carrier.toLowerCase();
  
  const getCarrierLogo = () => {
    switch (carrierLower) {
      case 'usps':
        return (
          <div className={`${className} flex items-center justify-center bg-blue-600 text-white px-3 py-1 rounded font-bold text-sm`}>
            USPS
          </div>
        );
      case 'ups':
        return (
          <div className={`${className} flex items-center justify-center bg-amber-600 text-white px-3 py-1 rounded font-bold text-sm`}>
            UPS
          </div>
        );
      case 'fedex':
        return (
          <div className={`${className} flex items-center justify-center bg-purple-600 text-white px-3 py-1 rounded font-bold text-sm`}>
            FedEx
          </div>
        );
      case 'dhl':
        return (
          <div className={`${className} flex items-center justify-center bg-yellow-600 text-white px-3 py-1 rounded font-bold text-sm`}>
            DHL
          </div>
        );
      default:
        return (
          <div className={`${className} flex items-center justify-center bg-gray-600 text-white px-3 py-1 rounded font-bold text-sm`}>
            {carrier.toUpperCase()}
          </div>
        );
    }
  };

  return getCarrierLogo();
};

export default CarrierLogo;

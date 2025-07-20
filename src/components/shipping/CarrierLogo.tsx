
import React from 'react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-8 h-8" }) => {
  const getCarrierLogo = (carrierName: string) => {
    const name = carrierName.toUpperCase();
    
    switch (name) {
      case 'UPS':
        return (
          <div className={`${className} bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center rounded-lg shadow-md font-bold text-xs border-2 border-amber-500`}>
            <span className="text-white drop-shadow-sm">UPS</span>
          </div>
        );
      case 'USPS':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center rounded-lg shadow-md font-bold text-xs border-2 border-blue-500`}>
            <span className="text-white drop-shadow-sm">USPS</span>
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${className} bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center rounded-lg shadow-md font-bold text-xs border-2 border-purple-500`}>
            <span className="text-white drop-shadow-sm">FedEx</span>
          </div>
        );
      case 'DHL':
        return (
          <div className={`${className} bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center rounded-lg shadow-md font-bold text-xs border-2 border-red-500`}>
            <span className="text-white drop-shadow-sm">DHL</span>
          </div>
        );
      default:
        return (
          <div className={`${className} bg-gradient-to-br from-gray-600 to-gray-700 text-white flex items-center justify-center rounded-lg shadow-md font-bold text-xs border-2 border-gray-500`}>
            <span className="text-white drop-shadow-sm">{name.slice(0, 3)}</span>
          </div>
        );
    }
  };

  return getCarrierLogo(carrier);
};

export default CarrierLogo;

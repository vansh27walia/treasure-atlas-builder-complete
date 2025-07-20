
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
          <div className={`${className} bg-amber-600 text-white flex items-center justify-center rounded font-bold text-xs`}>
            UPS
          </div>
        );
      case 'USPS':
        return (
          <div className={`${className} bg-blue-600 text-white flex items-center justify-center rounded font-bold text-xs`}>
            USPS
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${className} bg-purple-600 text-white flex items-center justify-center rounded font-bold text-xs`}>
            FedEx
          </div>
        );
      case 'DHL':
        return (
          <div className={`${className} bg-red-600 text-white flex items-center justify-center rounded font-bold text-xs`}>
            DHL
          </div>
        );
      default:
        return (
          <div className={`${className} bg-gray-600 text-white flex items-center justify-center rounded font-bold text-xs`}>
            {name.slice(0, 3)}
          </div>
        );
    }
  };

  return getCarrierLogo(carrier);
};

export default CarrierLogo;

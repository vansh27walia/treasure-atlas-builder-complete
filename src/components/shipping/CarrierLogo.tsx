
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
          <div className={`${className} bg-amber-700 text-white flex items-center justify-center rounded-md relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[8px] font-black leading-none">UPS</div>
              <div className="w-3 h-0.5 bg-white rounded-full mt-0.5"></div>
            </div>
          </div>
        );
      case 'USPS':
        return (
          <div className={`${className} bg-blue-700 text-white flex items-center justify-center rounded-md relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[7px] font-bold leading-none">USPS</div>
              <div className="flex gap-0.5 mt-0.5">
                <div className="w-0.5 h-1 bg-red-400 rounded-full"></div>
                <div className="w-0.5 h-1 bg-white rounded-full"></div>
                <div className="w-0.5 h-1 bg-red-400 rounded-full"></div>
              </div>
            </div>
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${className} bg-purple-700 text-white flex items-center justify-center rounded-md relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800"></div>
            <div className="relative z-10 flex items-center justify-center">
              <div className="text-[7px] font-black leading-none">
                <span className="text-white">Fed</span>
                <span className="text-orange-400">Ex</span>
              </div>
            </div>
          </div>
        );
      case 'DHL':
        return (
          <div className={`${className} bg-red-600 text-white flex items-center justify-center rounded-md relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[8px] font-black leading-none text-yellow-300">DHL</div>
              <div className="w-3 h-0.5 bg-yellow-400 rounded-full mt-0.5"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${className} bg-gray-600 text-white flex items-center justify-center rounded-md font-bold text-xs`}>
            {name.slice(0, 3)}
          </div>
        );
    }
  };

  return getCarrierLogo(carrier);
};

export default CarrierLogo;

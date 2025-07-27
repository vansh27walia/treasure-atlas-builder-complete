
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
          <div className={`${className} bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-900"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[8px] font-black leading-none tracking-wider">UPS</div>
              <div className="w-4 h-0.5 bg-yellow-300 rounded-full mt-1"></div>
              <div className="text-[6px] font-semibold mt-0.5">LOGISTICS</div>
            </div>
          </div>
        );
      case 'USPS':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-900"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[7px] font-bold leading-none tracking-wider">USPS</div>
              <div className="flex gap-0.5 mt-1">
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-red-400 rounded-full"></div>
              </div>
              <div className="text-[5px] font-semibold mt-0.5">POSTAL</div>
            </div>
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${className} bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-900"></div>
            <div className="relative z-10 flex items-center justify-center">
              <div className="text-[7px] font-black leading-none tracking-wider">
                <span className="text-white">Fed</span>
                <span className="text-orange-400">Ex</span>
              </div>
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-0.5 bg-orange-400 rounded-full"></div>
              </div>
            </div>
          </div>
        );
      case 'DHL':
        return (
          <div className={`${className} bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-800"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="text-[8px] font-black leading-none text-yellow-300 tracking-wider">DHL</div>
              <div className="w-4 h-0.5 bg-yellow-400 rounded-full mt-1"></div>
              <div className="text-[5px] font-semibold text-yellow-300 mt-0.5">EXPRESS</div>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${className} bg-gradient-to-br from-gray-500 to-gray-700 text-white flex items-center justify-center rounded-md font-bold text-xs shadow-lg`}>
            {name.slice(0, 3)}
          </div>
        );
    }
  };

  return getCarrierLogo(carrier);
};

export default CarrierLogo;

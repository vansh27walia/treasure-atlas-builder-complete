
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
          <div className={`${className} flex items-center justify-center bg-blue-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
              <span className="text-sm font-bold">USPS</span>
            </div>
          </div>
        );
      case 'ups':
        return (
          <div className={`${className} flex items-center justify-center bg-yellow-600 text-amber-900 px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-amber-900 rounded-sm flex items-center justify-center">
                <div className="w-3 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <span className="text-sm font-bold">UPS</span>
            </div>
          </div>
        );
      case 'fedex':
        return (
          <div className={`${className} flex items-center justify-center bg-purple-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-orange-500 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <span className="text-sm font-bold">FedEx</span>
            </div>
          </div>
        );
      case 'dhl':
        return (
          <div className={`${className} flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-400 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              </div>
              <span className="text-sm font-bold">DHL</span>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${className} flex items-center justify-center bg-gray-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <span className="text-sm font-bold">{carrier.toUpperCase()}</span>
          </div>
        );
    }
  };

  return getCarrierLogo();
};

export default CarrierLogo;

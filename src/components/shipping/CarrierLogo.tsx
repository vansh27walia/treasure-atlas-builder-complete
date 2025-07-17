
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
          <div className={`${className} flex items-center justify-center bg-blue-600 text-white px-3 py-1 rounded-md font-bold text-sm`}>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <span>USPS</span>
            </div>
          </div>
        );
      case 'ups':
        return (
          <div className={`${className} flex items-center justify-center bg-yellow-600 text-black px-3 py-1 rounded-md font-bold text-sm`}>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-amber-800 rounded-sm flex items-center justify-center">
                <div className="w-2 h-1 bg-white rounded-full"></div>
              </div>
              <span>UPS</span>
            </div>
          </div>
        );
      case 'fedex':
        return (
          <div className={`${className} flex items-center justify-center bg-purple-600 text-white px-3 py-1 rounded-md font-bold text-sm`}>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>FedEx</span>
            </div>
          </div>
        );
      case 'dhl':
        return (
          <div className={`${className} flex items-center justify-center bg-red-600 text-white px-3 py-1 rounded-md font-bold text-sm`}>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span>DHL</span>
            </div>
          </div>
        );
      default:
        return (
          <div className={`${className} flex items-center justify-center bg-gray-600 text-white px-3 py-1 rounded-md font-bold text-sm`}>
            {carrier.toUpperCase()}
          </div>
        );
    }
  };

  return getCarrierLogo();
};

export default CarrierLogo;


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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
              </svg>
              <span className="text-sm font-bold">USPS</span>
            </div>
          </div>
        );
      case 'ups':
        return (
          <div className={`${className} flex items-center justify-center bg-yellow-600 text-amber-900 px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="6" width="18" height="12" rx="2"/>
                <path d="M3 6h18l-9 6-9-6z" fill="white"/>
              </svg>
              <span className="text-sm font-bold">UPS</span>
            </div>
          </div>
        );
      case 'fedex':
        return (
          <div className={`${className} flex items-center justify-center bg-purple-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-sm font-bold">FedEx</span>
            </div>
          </div>
        );
      case 'dhl':
        return (
          <div className={`${className} flex items-center justify-center bg-red-600 text-white px-3 py-2 rounded-md font-bold text-sm shadow-sm`}>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2"/>
              </svg>
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


import React from 'react';

interface EnhancedCarrierLogoProps {
  carrier: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedCarrierLogo: React.FC<EnhancedCarrierLogoProps> = ({ 
  carrier, 
  className = "",
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base"
  };

  const getCarrierLogo = (carrierName: string) => {
    const name = carrierName.toUpperCase();
    const baseClasses = `${sizeClasses[size]} ${className} flex items-center justify-center rounded-lg font-bold shadow-sm border-2`;
    
    switch (name) {
      case 'UPS':
        return (
          <div className={`${baseClasses} bg-amber-600 text-white border-amber-700`}>
            <div className="text-center">
              <div className="font-black tracking-tight">UPS</div>
              {size === 'lg' && <div className="text-xs mt-0.5 opacity-90">United Parcel</div>}
            </div>
          </div>
        );
      case 'USPS':
        return (
          <div className={`${baseClasses} bg-blue-600 text-white border-blue-700`}>
            <div className="text-center">
              <div className="font-black tracking-tight">USPS</div>
              {size === 'lg' && <div className="text-xs mt-0.5 opacity-90">US Postal</div>}
            </div>
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${baseClasses} bg-purple-600 text-white border-purple-700`}>
            <div className="text-center">
              <div className="font-black tracking-tight">FedEx</div>
              {size === 'lg' && <div className="text-xs mt-0.5 opacity-90">Federal Express</div>}
            </div>
          </div>
        );
      case 'DHL':
        return (
          <div className={`${baseClasses} bg-yellow-500 text-black border-yellow-600`}>
            <div className="text-center">
              <div className="font-black tracking-tight">DHL</div>
              {size === 'lg' && <div className="text-xs mt-0.5 opacity-90">Express</div>}
            </div>
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-600 text-white border-gray-700`}>
            <div className="text-center">
              <div className="font-black tracking-tight">{name.slice(0, 4)}</div>
              {size === 'lg' && <div className="text-xs mt-0.5 opacity-90">Carrier</div>}
            </div>
          </div>
        );
    }
  };

  return getCarrierLogo(carrier);
};

export default EnhancedCarrierLogo;

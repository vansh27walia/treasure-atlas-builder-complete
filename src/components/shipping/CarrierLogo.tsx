
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
            <img 
              src="/lovable-uploads/1519fff0-84ba-4c37-8eb2-49d0679b1dab.png" 
              alt="UPS Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="text-[8px] font-black">UPS</div>';
              }}
            />
          </div>
        );
      case 'USPS':
        return (
          <div className={`${className} bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <img 
              src="/lovable-uploads/788a234d-3e32-4de2-875f-65e541977a88.png" 
              alt="USPS Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="text-[7px] font-bold">USPS</div>';
              }}
            />
          </div>
        );
      case 'FEDEX':
        return (
          <div className={`${className} bg-gradient-to-br from-purple-600 to-purple-800 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
            <img 
              src="/lovable-uploads/55c3543a-bea2-4329-ae0c-c1f0bbb26faf.png" 
              alt="FedEx Logo"
              className="w-full h-full object-contain p-1"
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="text-[7px] font-black">FedEx</div>';
              }}
            />
          </div>
        );
      case 'DHL':
        return (
          <div className={`${className} bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center rounded-md relative overflow-hidden shadow-lg`}>
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

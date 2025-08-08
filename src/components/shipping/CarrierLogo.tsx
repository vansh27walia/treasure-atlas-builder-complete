
import React from 'react';
import { standardizeCarrierName } from '@/utils/carrierUtils';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-8 h-8" }) => {
  const getCarrierInfo = (carrierName: string) => {
    const standardizedCarrier = standardizeCarrierName(carrierName);
    
    switch (standardizedCarrier) {
      case 'USPS':
        return {
          name: 'USPS',
          logo: '/lovable-uploads/dd955829-1318-4987-97c1-3e2c13cce8bc.png',
          color: 'bg-blue-600',
          textColor: 'text-white'
        };
      case 'UPS':
        return {
          name: 'UPS',
          logo: '/lovable-uploads/321101c1-be0c-4392-a060-180db437f38d.png',
          color: 'bg-yellow-600',
          textColor: 'text-white'
        };
      case 'FedEx':
        return {
          name: 'FedEx',
          logo: '/lovable-uploads/b92bf2f4-d7b0-47a4-b30a-3097d19fdc40.png',
          color: 'bg-purple-600',
          textColor: 'text-white'
        };
      case 'DHL':
        return {
          name: 'DHL',
          logo: '/lovable-uploads/e850cf45-5d99-4764-9203-fd08677fd1e6.png',
          color: 'bg-red-600',
          textColor: 'text-white'
        };
      case 'Canada Post':
        return {
          name: 'Canada Post',
          logo: null,
          color: 'bg-red-700',
          textColor: 'text-white'
        };
      default:
        return {
          name: standardizedCarrier.toUpperCase(),
          logo: null,
          color: 'bg-gray-600',
          textColor: 'text-white'
        };
    }
  };

  const carrierInfo = getCarrierInfo(carrier);

  return (
    <div className={`${className} flex items-center justify-center rounded-md overflow-hidden`}>
      {carrierInfo.logo ? (
        <img 
          src={carrierInfo.logo} 
          alt={carrierInfo.name}
          className={`${className} object-contain`}
          onError={(e) => {
            // Fallback to text if image fails to load
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
      ) : null}
      <div 
        className={`${className} ${carrierInfo.color} ${carrierInfo.textColor} items-center justify-center text-xs font-bold rounded-md ${carrierInfo.logo ? 'hidden' : 'flex'}`}
        style={{ display: carrierInfo.logo ? 'none' : 'flex' }}
      >
        {carrierInfo.name.slice(0, 3)}
      </div>
    </div>
  );
};

export default CarrierLogo;

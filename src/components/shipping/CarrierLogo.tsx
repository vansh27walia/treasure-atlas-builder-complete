
import React from 'react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-8 h-8" }) => {
  const getCarrierInfo = (carrierName: string) => {
    const normalizedCarrier = carrierName.toLowerCase();
    
    if (normalizedCarrier.includes('usps')) {
      return {
        name: 'USPS',
        logo: '/carriers/usps-logo.png',
        color: 'bg-blue-600',
        textColor: 'text-white'
      };
    } else if (normalizedCarrier.includes('ups')) {
      return {
        name: 'UPS',
        logo: '/carriers/ups-logo.png',
        color: 'bg-yellow-600',
        textColor: 'text-white'
      };
    } else if (normalizedCarrier.includes('fedex')) {
      return {
        name: 'FedEx',
        logo: '/carriers/fedex-logo.png',
        color: 'bg-purple-600',
        textColor: 'text-white'
      };
    } else if (normalizedCarrier.includes('dhl')) {
      return {
        name: 'DHL',
        logo: '/carriers/dhl-logo.png',
        color: 'bg-red-600',
        textColor: 'text-white'
      };
    } else {
      return {
        name: carrierName.toUpperCase(),
        logo: null,
        color: 'bg-gray-600',
        textColor: 'text-white'
      };
    }
  };

  const carrierInfo = getCarrierInfo(carrier);

  return (
    <div className={`${className} flex items-center justify-center rounded-md ${carrierInfo.color}`}>
      {carrierInfo.logo ? (
        <img 
          src={carrierInfo.logo} 
          alt={carrierInfo.name}
          className={className}
          onError={(e) => {
            // Fallback to text if image fails to load
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'block';
            }
          }}
        />
      ) : null}
      <span 
        className={`text-xs font-bold ${carrierInfo.textColor} ${carrierInfo.logo ? 'hidden' : 'block'}`}
        style={{ display: carrierInfo.logo ? 'none' : 'block' }}
      >
        {carrierInfo.name.slice(0, 3)}
      </span>
    </div>
  );
};

export default CarrierLogo;

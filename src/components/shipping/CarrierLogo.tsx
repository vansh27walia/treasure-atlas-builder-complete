
import React from 'react';
import { cn } from '@/lib/utils';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ 
  carrier, 
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  // Map carrier names to appropriate logos
  const getLogoUrl = () => {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) {
      return "https://www.usps.com/assets/images/home/logo-sb.svg";
    } else if (carrierLower.includes('ups')) {
      return "https://www.ups.com/assets/resources/images/UPS_logo.svg";
    } else if (carrierLower.includes('fedex')) {
      return "https://www.fedex.com/content/dam/fedex-com/logos/logo.png";
    } else if (carrierLower.includes('dhl')) {
      return "https://www.dhl.com/img/meta/dhl-logo.png";
    }
    return null;
  };

  const logoUrl = getLogoUrl();
  
  if (!logoUrl) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded bg-gray-100 px-3", 
        sizeClasses[size],
        className
      )}>
        <span className="font-bold text-gray-600">{carrier.toUpperCase()}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center rounded bg-white p-1", 
      sizeClasses[size],
      className
    )}>
      <img
        src={logoUrl}
        alt={`${carrier} logo`}
        className="h-full w-auto object-contain"
      />
    </div>
  );
};

export default CarrierLogo;

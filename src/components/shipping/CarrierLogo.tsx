
import React from 'react';
import { Truck, Package, Plane } from 'lucide-react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-6 h-6" }) => {
  const carrierLower = carrier.toLowerCase();
  
  // Define carrier-specific colors
  const getCarrierColor = (carrier: string) => {
    switch (carrier) {
      case 'ups':
        return 'text-amber-800'; // Brown for UPS
      case 'usps':
        return 'text-blue-600'; // Blue for USPS
      case 'fedex':
        return 'text-purple-600'; // Purple for FedEx
      case 'dhl':
        return 'text-yellow-500'; // Yellow for DHL
      default:
        return 'text-gray-600';
    }
  };

  const colorClass = getCarrierColor(carrierLower);

  if (carrierLower.includes('ups')) {
    return <Truck className={`${className} ${colorClass}`} />;
  }
  
  if (carrierLower.includes('usps')) {
    return <Package className={`${className} ${colorClass}`} />;
  }
  
  if (carrierLower.includes('fedex')) {
    return <Plane className={`${className} ${colorClass}`} />;
  }
  
  if (carrierLower.includes('dhl')) {
    return <Plane className={`${className} ${colorClass}`} />;
  }
  
  // Default icon for unknown carriers
  return <Truck className={`${className} ${colorClass}`} />;
};

export default CarrierLogo;

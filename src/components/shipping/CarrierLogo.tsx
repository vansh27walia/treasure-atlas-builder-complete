
import React from 'react';
import { Truck, Package } from 'lucide-react';

interface CarrierLogoProps {
  carrier: string;
  className?: string;
}

const CarrierLogo: React.FC<CarrierLogoProps> = ({ carrier, className = "w-8 h-8" }) => {
  const getCarrierColor = (carrierName: string) => {
    const normalizedCarrier = carrierName.toUpperCase();
    
    switch (normalizedCarrier) {
      case 'UPS':
        return 'text-amber-800 bg-amber-100'; // Brown for UPS
      case 'USPS':
        return 'text-blue-600 bg-blue-100'; // Blue for USPS
      case 'FEDEX':
        return 'text-purple-600 bg-purple-100'; // Purple for FedEx
      case 'DHL':
        return 'text-yellow-600 bg-yellow-100'; // Yellow for DHL
      case 'ONTRAC':
        return 'text-red-600 bg-red-100';
      case 'LASERSHIP':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const carrierColors = getCarrierColor(carrier);

  return (
    <div className={`${className} ${carrierColors} rounded-lg flex items-center justify-center p-1`}>
      {carrier.toUpperCase() === 'FEDEX' ? (
        <Package className="w-5 h-5" />
      ) : (
        <Truck className="w-5 h-5" />
      )}
    </div>
  );
};

export default CarrierLogo;

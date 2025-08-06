
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import CustomsDocumentationModal from '../CustomsDocumentationModal';
import { BulkShipment, CustomsInfo } from '@/types/shipping';

interface CustomsClearanceButtonProps {
  shipment: BulkShipment;
  onCustomsUpdate: (shipmentId: string, customsInfo: CustomsInfo) => void;
}

const CustomsClearanceButton: React.FC<CustomsClearanceButtonProps> = ({
  shipment,
  onCustomsUpdate
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasCustomsData, setHasCustomsData] = useState(!!shipment.details?.customs_info);

  const handleCustomsSubmit = (customsInfo: CustomsInfo) => {
    onCustomsUpdate(shipment.id, customsInfo);
    setHasCustomsData(true);
    setIsModalOpen(false);
  };

  // Check if destination country is not US
  const isInternational = shipment.details?.to_address?.country && 
                         shipment.details.to_address.country.toLowerCase() !== 'us' &&
                         shipment.details.to_address.country.toLowerCase() !== 'usa' &&
                         shipment.details.to_address.country.toLowerCase() !== 'united states';

  if (!isInternational) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        size="sm"
        variant="outline"
        className={`${hasCustomsData ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white'}`}
      >
        <FileText className="w-4 h-4 mr-1" />
        Custom Clearance
      </Button>
      
      <CustomsDocumentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCustomsSubmit}
        fromCountry="US"
        toCountry={shipment.details?.to_address?.country || ""}
        initialData={shipment.details?.customs_info}
      />
    </>
  );
};

export default CustomsClearanceButton;

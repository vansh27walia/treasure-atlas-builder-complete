
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { BulkShipment, CustomsInfo } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface CustomsButtonProps {
  shipment: BulkShipment;
  onCustomsSave: (shipmentId: string, customsInfo: CustomsInfo) => void;
}

const CustomsButton: React.FC<CustomsButtonProps> = ({ shipment, onCustomsSave }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show for international shipments (destination country not US)
  const isInternational = shipment.details?.to_address?.country && 
                          shipment.details.to_address.country.toUpperCase() !== 'US';

  if (!isInternational) {
    return null;
  }

  const handleCustomsSubmit = (customsInfo: CustomsInfo) => {
    onCustomsSave(shipment.id, customsInfo);
    setIsModalOpen(false);
  };

  const fromCountry = 'US'; // Assuming pickup is from US
  const toCountry = shipment.details?.to_address?.country || 'Unknown';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="h-8 px-2 text-xs"
      >
        <FileText className="w-3 h-3 mr-1" />
        Customs
      </Button>

      <CustomsDocumentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCustomsSubmit}
        fromCountry={fromCountry}
        toCountry={toCountry}
        initialData={shipment.customs_info}
      />
    </>
  );
};

export default CustomsButton;

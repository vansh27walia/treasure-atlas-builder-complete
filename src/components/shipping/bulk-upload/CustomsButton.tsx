
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
  const [showCustomsModal, setShowCustomsModal] = useState(false);

  // Only show for international shipments (non-US destinations)
  const isInternational = shipment.details?.to_address?.country && 
                         shipment.details.to_address.country !== 'US';

  if (!isInternational) {
    return null;
  }

  const handleCustomsSubmit = (customsInfo: CustomsInfo) => {
    console.log('Saving customs info for shipment:', shipment.id, customsInfo);
    onCustomsSave(shipment.id, customsInfo);
    setShowCustomsModal(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCustomsModal(true)}
        className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        title="International customs information required"
      >
        <FileText className="w-4 h-4" />
        <span className="ml-1 text-xs">Customs</span>
      </Button>

      {showCustomsModal && (
        <CustomsDocumentationModal
          isOpen={showCustomsModal}
          onClose={() => setShowCustomsModal(false)}
          onSubmit={handleCustomsSubmit}
          fromCountry="US"
          toCountry={shipment.details?.to_address?.country || ''}
          initialData={shipment.customs_info}
        />
      )}
    </>
  );
};

export default CustomsButton;

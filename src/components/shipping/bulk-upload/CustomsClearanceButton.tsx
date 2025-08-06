
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

  const handleCustomsSubmit = (customs: any) => {
    // Convert the modal's customs format to our shipping CustomsInfo format
    const customsInfo: CustomsInfo = {
      eel_pfc: customs.eel_pfc,
      customs_certify: customs.customs_certify,
      customs_signer: customs.customs_signer,
      contents_type: customs.contents_type as 'merchandise' | 'documents' | 'gift' | 'returned_goods' | 'sample' | 'other',
      restriction_type: customs.restriction_type as 'none' | 'other' | 'quarantine' | 'sanitary_phytosanitary_inspection',
      non_delivery_option: customs.non_delivery_option as 'return' | 'abandon',
      customs_items: customs.customs_items
    };
    
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
        initialData={shipment.details?.customs_info ? {
          contents_type: shipment.details.customs_info.contents_type || 'merchandise',
          customs_certify: shipment.details.customs_info.customs_certify || true,
          customs_signer: shipment.details.customs_info.customs_signer || '',
          non_delivery_option: shipment.details.customs_info.non_delivery_option || 'return',
          customs_items: shipment.details.customs_info.customs_items || []
        } : undefined}
      />
    </>
  );
};

export default CustomsClearanceButton;

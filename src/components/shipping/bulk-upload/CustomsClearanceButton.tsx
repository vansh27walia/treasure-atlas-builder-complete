
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Check, AlertCircle } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

// Local interface to match what we need
interface LocalCustomsInfo {
  contents_type: string;
  contents_explanation?: string;
  customs_certify: boolean;
  customs_signer: string;
  non_delivery_option: string;
  restriction_type: string; 
  restriction_comments: string; 
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number: string; 
    origin_country: string;
  }>;
  eel_pfc: string; 
  phone_number: string; // Required phone_number field
}

interface CustomsClearanceButtonProps {
  shipment: BulkShipment;
  customsInfo?: LocalCustomsInfo;
  onCustomsInfoSave: (info: LocalCustomsInfo) => void;
}

const CustomsClearanceButton: React.FC<CustomsClearanceButtonProps> = ({
  shipment,
  customsInfo,
  onCustomsInfoSave
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if shipment is international (non-US)
  const isInternational = () => {
    const country = shipment.details.to_country?.toUpperCase();
    return country !== 'US' && country !== 'USA' && country !== 'UNITED STATES';
  };

  const handleSave = (info: LocalCustomsInfo) => {
    onCustomsInfoSave(info);
    setIsModalOpen(false);
  };

  const international = isInternational();
  const hasCustomsInfo = customsInfo && customsInfo.customs_items?.length > 0;

  // Validation check - ensure required fields are present
  const isCustomsComplete = hasCustomsInfo && 
    customsInfo.customs_signer && 
    customsInfo.phone_number &&
    customsInfo.customs_items.every(item => 
      item.description && 
      item.value > 0 && 
      item.weight > 0 && 
      item.quantity > 0
    );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={!international}
        onClick={() => setIsModalOpen(true)}
        className={`w-full transition-all duration-200 ${
          international
            ? isCustomsComplete
              ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
              : hasCustomsInfo
                ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200'
                : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 blur-sm'
        }`}
      >
        <Globe className="w-4 h-4 mr-2" />
        {!international ? 
          'Domestic' : 
          isCustomsComplete ? 
            'Complete' : 
            hasCustomsInfo ? 
              'Incomplete' : 
              'Required'
        }
        {isCustomsComplete && <Check className="w-4 h-4 ml-2" />}
        {hasCustomsInfo && !isCustomsComplete && <AlertCircle className="w-4 h-4 ml-2" />}
      </Button>

      {international && (
        <CustomsDocumentationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSave}
          fromCountry="US"
          toCountry={shipment.details.to_country || ""}
          initialData={customsInfo}
        />
      )}
    </>
  );
};

export default CustomsClearanceButton;

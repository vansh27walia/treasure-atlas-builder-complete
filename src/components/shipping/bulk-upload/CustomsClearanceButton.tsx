
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Globe, Check } from 'lucide-react';
import { BulkShipment } from '@/types/shipping';
import CustomsDocumentationModal from '../CustomsDocumentationModal';

interface CustomsInfo {
  customs_certify: boolean;
  customs_signer: string;
  contents_type: string;
  contents_explanation?: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  restriction_comments?: string;
  customs_items: Array<{
    description: string;
    quantity: number;
    value: number;
    weight: number;
    hs_tariff_number?: string;
    origin_country: string;
  }>;
}

interface CustomsClearanceButtonProps {
  shipment: BulkShipment;
  customsInfo?: CustomsInfo;
  onCustomsInfoSave: (info: CustomsInfo) => void;
}

const CustomsClearanceButton: React.FC<CustomsClearanceButtonProps> = ({
  shipment,
  customsInfo,
  onCustomsInfoSave
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if shipment is international (non-US)
  const isInternational = () => {
    const toCountry = shipment.details?.to_address?.country || shipment.details?.to_country;
    const country = toCountry?.toUpperCase();
    return country !== 'US' && country !== 'USA' && country !== 'UNITED STATES';
  };

  const handleSave = (info: CustomsInfo) => {
    onCustomsInfoSave(info);
    setIsOpen(false);
  };

  const international = isInternational();
  const hasCustomsInfo = customsInfo && customsInfo.customs_items?.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!international}
          className={`w-full transition-all duration-200 ${
            international
              ? hasCustomsInfo
                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 blur-sm'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          {!international ? 'Domestic' : hasCustomsInfo ? 'Completed' : 'Required'}
          {hasCustomsInfo && <Check className="w-4 h-4 ml-2" />}
        </Button>
      </DialogTrigger>
      {international && (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custom Clearance Documentation</DialogTitle>
          </DialogHeader>
          <CustomsDocumentationModal
            isOpen={true}
            onClose={() => setIsOpen(false)}
            onSubmit={handleSave}
            fromCountry="US"
            toCountry={shipment.details?.to_address?.country || shipment.details?.to_country || ""}
            initialData={customsInfo}
          />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default CustomsClearanceButton;

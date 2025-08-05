
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { BulkShipment, CustomsInfo } from '@/types/shipping';

interface CustomsCheckboxProps {
  shipment: BulkShipment;
  onCustomsToggle: (shipmentId: string, enabled: boolean) => void;
  onCustomsEdit: (shipmentId: string) => void;
  isInternational: boolean;
}

const CustomsCheckbox: React.FC<CustomsCheckboxProps> = ({
  shipment,
  onCustomsToggle,
  onCustomsEdit,
  isInternational
}) => {
  if (!isInternational) {
    return null;
  }

  const hasCustomsInfo = shipment.details?.customs_info && 
    shipment.details.customs_info.customs_items && 
    shipment.details.customs_info.customs_items.length > 0;

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onCustomsEdit(shipment.id);
    } else {
      onCustomsToggle(shipment.id, false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={`customs-${shipment.id}`}
        checked={hasCustomsInfo}
        onCheckedChange={handleCheckboxChange}
      />
      <Label htmlFor={`customs-${shipment.id}`} className="flex items-center gap-1 text-sm cursor-pointer">
        <FileText className="w-3 h-3" />
        Customs Required
      </Label>
    </div>
  );
};

export default CustomsCheckbox;

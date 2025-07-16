
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PackageTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const packageTypes = [
  { value: 'box', label: '📦 Box' },
  { value: 'envelope', label: '📨 Envelope' },
  { value: 'usps_medium_flat_rate_box', label: '📮 USPS Medium Flat Rate Box' },
  { value: 'usps_small_flat_rate_box', label: '📮 USPS Small Flat Rate Box' },
  { value: 'usps_flat_rate_envelope', label: '📮 USPS Flat Rate Envelope' },
  { value: 'usps_priority_mail_express_envelope', label: '📮 USPS Priority Express Envelope' },
  { value: 'fedex_envelope', label: '📦 FedEx Envelope' },
  { value: 'fedex_box', label: '📦 FedEx Box' },
  { value: 'fedex_small_box', label: '📦 FedEx Small Box' },
  { value: 'fedex_medium_box', label: '📦 FedEx Medium Box' },
  { value: 'ups_letter', label: '🚛 UPS Letter' },
  { value: 'ups_box', label: '🚛 UPS Box' },
  { value: 'ups_small_express_box', label: '🚛 UPS Small Express Box' },
  { value: 'dhl_flyer', label: '✈️ DHL Flyer' },
  { value: 'dhl_express_envelope', label: '✈️ DHL Express Envelope' },
];

const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Package Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select package type" />
        </SelectTrigger>
        <SelectContent>
          {packageTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PackageTypeSelector;

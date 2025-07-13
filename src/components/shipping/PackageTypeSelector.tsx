
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Package } from 'lucide-react';

interface PackageTypeSelectorProps {
  selectedCarrier: string;
  selectedPackageType: string;
  onPackageTypeChange: (packageType: string) => void;
}

const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({
  selectedCarrier,
  selectedPackageType,
  onPackageTypeChange,
}) => {
  const packageOptions = [
    { value: 'custom_box', label: 'Custom Box', category: 'Custom' },
    { value: 'envelope', label: 'Envelope', category: 'Custom' },
    
    // USPS Options
    { value: 'FlatRateEnvelope', label: 'Flat Rate Envelope', category: 'USPS' },
    { value: 'FlatRateLegalEnvelope', label: 'Flat Rate Legal Envelope', category: 'USPS' },
    { value: 'FlatRatePaddedEnvelope', label: 'Flat Rate Padded Envelope', category: 'USPS' },
    { value: 'SmallFlatRateBox', label: 'Small Flat Rate Box', category: 'USPS' },
    { value: 'MediumFlatRateBox', label: 'Medium Flat Rate Box', category: 'USPS' },
    { value: 'LargeFlatRateBox', label: 'Large Flat Rate Box', category: 'USPS' },
    { value: 'RegionalRateBoxA', label: 'Regional Rate Box A', category: 'USPS' },
    { value: 'RegionalRateBoxB', label: 'Regional Rate Box B', category: 'USPS' },
    
    // UPS Options
    { value: 'UPSLetter', label: 'UPS Letter', category: 'UPS' },
    { value: 'UPSExpressBox', label: 'UPS Express Box', category: 'UPS' },
    { value: 'UPS25kgBox', label: 'UPS 25kg Box', category: 'UPS' },
    { value: 'UPS10kgBox', label: 'UPS 10kg Box', category: 'UPS' },
    { value: 'Tube', label: 'Tube', category: 'UPS' },
    { value: 'Pak', label: 'Pak', category: 'UPS' },
    { value: 'SmallExpressBox', label: 'Small Express Box', category: 'UPS' },
    { value: 'MediumExpressBox', label: 'Medium Express Box', category: 'UPS' },
    { value: 'LargeExpressBox', label: 'Large Express Box', category: 'UPS' },
    
    // FedEx Options
    { value: 'FedExEnvelope', label: 'FedEx Envelope', category: 'FedEx' },
    { value: 'FedExBox', label: 'FedEx Box', category: 'FedEx' },
    { value: 'FedExSmallBox', label: 'FedEx Small Box', category: 'FedEx' },
    { value: 'FedExMediumBox', label: 'FedEx Medium Box', category: 'FedEx' },
    { value: 'FedExLargeBox', label: 'FedEx Large Box', category: 'FedEx' },
    { value: 'FedExPak', label: 'FedEx Pak', category: 'FedEx' },
    { value: 'FedExTube', label: 'FedEx Tube', category: 'FedEx' },
    
    // DHL Options
    { value: 'DHLEnvelope', label: 'DHL Envelope', category: 'DHL Express' },
    { value: 'DHLFlyer', label: 'DHL Flyer', category: 'DHL Express' },
    { value: 'DHLExpressBox', label: 'DHL Express Box', category: 'DHL Express' },
    { value: 'DHLJumboBox', label: 'DHL Jumbo Box', category: 'DHL Express' },
    { value: 'DHLSmallBox', label: 'DHL Small Box', category: 'DHL Express' },
    { value: 'DHLLargeBox', label: 'DHL Large Box', category: 'DHL Express' },
    { value: 'DHLPak', label: 'DHL Pak', category: 'DHL Express' },
    { value: 'DHLTube', label: 'DHL Tube', category: 'DHL Express' },
  ];

  // Group options by category for better UX
  const groupedOptions = packageOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof packageOptions>);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Package className="h-4 w-4" />
        Package Type
      </Label>
      <Select value={selectedPackageType} onValueChange={onPackageTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select package type" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {Object.entries(groupedOptions).map(([category, options]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 sticky top-0">
                📦 {category}
              </div>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PackageTypeSelector;

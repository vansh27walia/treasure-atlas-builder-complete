
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface PackageTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const packageTypes = [
  // Custom package types
  { value: 'box', label: '📦 Custom Box' },
  { value: 'envelope', label: '📨 Custom Envelope' },
  
  // USPS Predefined Packages
  { value: 'Card', label: '📮 USPS Card' },
  { value: 'Letter', label: '📮 USPS Letter' },
  { value: 'Flat', label: '📮 USPS Flat' },
  { value: 'FlatRateEnvelope', label: '📮 USPS Flat Rate Envelope' },
  { value: 'FlatRateLegalEnvelope', label: '📮 USPS Flat Rate Legal Envelope' },
  { value: 'FlatRatePaddedEnvelope', label: '📮 USPS Flat Rate Padded Envelope' },
  { value: 'FlatRateWindowEnvelope', label: '📮 USPS Flat Rate Window Envelope' },
  { value: 'FlatRateCardboardEnvelope', label: '📮 USPS Flat Rate Cardboard Envelope' },
  { value: 'SmallFlatRateEnvelope', label: '📮 USPS Small Flat Rate Envelope' },
  { value: 'Parcel', label: '📮 USPS Parcel' },
  { value: 'SoftPack', label: '📮 USPS Soft Pack' },
  { value: 'SmallFlatRateBox', label: '📮 USPS Small Flat Rate Box' },
  { value: 'MediumFlatRateBox', label: '📮 USPS Medium Flat Rate Box' },
  { value: 'LargeFlatRateBox', label: '📮 USPS Large Flat Rate Box' },
  { value: 'LargeFlatRateBoxAPOFPO', label: '📮 USPS Large Flat Rate Box APO/FPO' },
  { value: 'FlatTubTrayBox', label: '📮 USPS Flat Tub Tray Box' },
  { value: 'EMMTrayBox', label: '📮 USPS EMM Tray Box' },
  { value: 'FullTrayBox', label: '📮 USPS Full Tray Box' },
  { value: 'HalfTrayBox', label: '📮 USPS Half Tray Box' },
  { value: 'PMODSack', label: '📮 USPS PMOD Sack' },
  
  // FedEx Predefined Packages
  { value: 'FedExEnvelope', label: '📦 FedEx Envelope' },
  { value: 'FedExBox', label: '📦 FedEx Box' },
  { value: 'FedExPak', label: '📦 FedEx Pak' },
  { value: 'FedExTube', label: '📦 FedEx Tube' },
  { value: 'FedEx10kgBox', label: '📦 FedEx 10kg Box' },
  { value: 'FedEx25kgBox', label: '📦 FedEx 25kg Box' },
  { value: 'FedExSmallBox', label: '📦 FedEx Small Box' },
  { value: 'FedExMediumBox', label: '📦 FedEx Medium Box' },
  { value: 'FedExLargeBox', label: '📦 FedEx Large Box' },
  { value: 'FedExExtraLargeBox', label: '📦 FedEx Extra Large Box' },
  
  // DHL Predefined Packages
  { value: 'JumboDocument', label: '✈️ DHL Jumbo Document' },
  { value: 'JumboParcel', label: '✈️ DHL Jumbo Parcel' },
  { value: 'Document', label: '✈️ DHL Document' },
  { value: 'DHLFlyer', label: '✈️ DHL Flyer' },
  { value: 'Domestic', label: '✈️ DHL Domestic' },
  { value: 'ExpressDocument', label: '✈️ DHL Express Document' },
  { value: 'DHLExpressEnvelope', label: '✈️ DHL Express Envelope' },
  { value: 'JumboBox', label: '✈️ DHL Jumbo Box' },
  { value: 'JumboJuniorDocument', label: '✈️ DHL Jumbo Junior Document' },
  { value: 'JuniorJumboBox', label: '✈️ DHL Junior Jumbo Box' },
  { value: 'JumboJuniorParcel', label: '✈️ DHL Jumbo Junior Parcel' },
  { value: 'OtherDHLPackaging', label: '✈️ DHL Other Packaging' },
  { value: 'YourPackaging', label: '✈️ DHL Your Packaging' },
  
  // UPS Predefined Packages
  { value: 'UPSLetter', label: '🚛 UPS Letter' },
  { value: 'UPSExpressBox', label: '🚛 UPS Express Box' },
  { value: 'UPS25kgBox', label: '🚛 UPS 25kg Box' },
  { value: 'UPS10kgBox', label: '🚛 UPS 10kg Box' },
  { value: 'Tube', label: '🚛 UPS Tube' },
  { value: 'Pak', label: '🚛 UPS Pak' },
  { value: 'SmallExpressBox', label: '🚛 UPS Small Express Box' },
  { value: 'MediumExpressBox', label: '🚛 UPS Medium Express Box' },
  { value: 'LargeExpressBox', label: '🚛 UPS Large Express Box' },
  
  // Legacy packages for backward compatibility
  { value: 'canada_post_box', label: '🍁 Canada Post Box' },
  { value: 'uk_post_box', label: '🇬🇧 UK Post Box' },
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

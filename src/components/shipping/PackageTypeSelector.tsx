
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Package, Mail, Truck } from 'lucide-react';
import { PackageType, PACKAGE_TYPES, CARRIER_OPTIONS, CARRIER_PACKAGES, CarrierPackageOption } from '@/types/shipping';

interface PackageTypeSelectorProps {
  packageType: PackageType;
  carrier?: string;
  predefinedPackage?: string;
  onPackageTypeChange: (type: PackageType) => void;
  onCarrierChange: (carrier: string) => void;
  onPredefinedPackageChange: (pkg: string) => void;
}

const PackageTypeSelector: React.FC<PackageTypeSelectorProps> = ({
  packageType,
  carrier,
  predefinedPackage,
  onPackageTypeChange,
  onCarrierChange,
  onPredefinedPackageChange
}) => {
  const getPackageIcon = (type: PackageType) => {
    switch (type) {
      case 'custom':
        return <Package className="h-4 w-4" />;
      case 'envelope':
        return <Mail className="h-4 w-4" />;
      case 'flat-rate':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const availablePackages = carrier ? CARRIER_PACKAGES[carrier] || [] : [];

  return (
    <div className="space-y-4">
      {/* Package Type Selection */}
      <div>
        <Label htmlFor="packageType" className="text-sm font-medium text-gray-700 mb-2 block">
          Package Type
        </Label>
        <Select value={packageType} onValueChange={(value: PackageType) => onPackageTypeChange(value)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select package type" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
            {PACKAGE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value} className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  {getPackageIcon(type.value as PackageType)}
                  <span>{type.label}</span>
                  <span className="text-lg">{type.icon}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Carrier Selection (only for flat-rate) */}
      {packageType === 'flat-rate' && (
        <div>
          <Label htmlFor="carrier" className="text-sm font-medium text-gray-700 mb-2 block">
            Select Carrier
          </Label>
          <Select value={carrier || ''} onValueChange={onCarrierChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose carrier" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999]">
              {CARRIER_OPTIONS.map((carrierOption) => (
                <SelectItem key={carrierOption.value} value={carrierOption.value} className="py-2 px-3 hover:bg-gray-50">
                  {carrierOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Predefined Package Selection (only when carrier is selected) */}
      {packageType === 'flat-rate' && carrier && (
        <div>
          <Label htmlFor="predefinedPackage" className="text-sm font-medium text-gray-700 mb-2 block">
            Select {CARRIER_OPTIONS.find(c => c.value === carrier)?.label} Package
          </Label>
          <Select value={predefinedPackage || ''} onValueChange={onPredefinedPackageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose package" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-[9999] max-h-60 overflow-y-auto">
              {availablePackages.map((pkg: CarrierPackageOption) => (
                <SelectItem key={pkg.value} value={pkg.value} className="py-3 px-3 hover:bg-gray-50">
                  <div className="flex flex-col">
                    <span className="font-medium">{pkg.label}</span>
                    {pkg.description && (
                      <span className="text-xs text-gray-500 mt-1">{pkg.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Package Type Info */}
      <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        {packageType === 'custom' && (
          <p><strong>Custom Box:</strong> Enter your own dimensions and weight. Perfect for unique package sizes.</p>
        )}
        {packageType === 'envelope' && (
          <p><strong>Envelope:</strong> For flat items like documents. Only length, width, and weight needed.</p>
        )}
        {packageType === 'flat-rate' && (
          <p><strong>Flat Rate:</strong> Use carrier-specific packaging with predictable pricing. Just add weight!</p>
        )}
      </div>
    </div>
  );
};

export default PackageTypeSelector;

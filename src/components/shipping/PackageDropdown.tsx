
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package } from 'lucide-react';

interface PackageOption {
  value: string;
  label: string;
  type: 'custom' | 'predefined';
  icon: string;
  description: string;
  image?: string;
  category?: string;
}

interface PackageDropdownProps {
  options: PackageOption[];
  value: string;
  onValueChange: (value: string) => void;
}

const PackageDropdown: React.FC<PackageDropdownProps> = ({
  options,
  value,
  onValueChange
}) => {
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900 flex items-center">
        <Package className="w-4 h-4 mr-2 text-blue-600" />
        Package Type
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full h-14 bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 rounded-xl shadow-sm">
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-lg">{selectedOption.icon}</span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{selectedOption.label}</div>
                  <div className="text-xs text-gray-500">{selectedOption.description}</div>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-80 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl">
          {/* Custom Packages */}
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
              Custom Packages
            </div>
            {options.filter(opt => opt.type === 'custom').map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-xl">{option.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </div>

          {/* Carrier Packages */}
          {['USPS', 'UPS', 'FedEx', 'DHL'].map(carrier => {
            const carrierOptions = options.filter(opt => opt.category === carrier);
            if (carrierOptions.length === 0) return null;
            
            return (
              <div key={carrier} className="p-2 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 flex items-center">
                  <span className="mr-2">
                    {carrier === 'USPS' && '🇺🇸'}
                    {carrier === 'UPS' && '🤎'}
                    {carrier === 'FedEx' && '💜'}
                    {carrier === 'DHL' && '🟡'}
                  </span>
                  {carrier} Packages
                </div>
                {carrierOptions.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="p-3 rounded-lg hover:bg-blue-50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <span className="text-sm">{option.icon}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {option.label.replace(`${carrier} - `, '')}
                        </div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </div>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PackageDropdown;

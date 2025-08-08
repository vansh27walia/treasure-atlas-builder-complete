
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries } from '@/lib/countries';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select country"
}) => {
  // Filter out any countries with empty codes
  const validCountries = countries.filter(country => country.code && country.code.trim() !== '');

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {validCountries.map((country) => (
          <SelectItem key={country.code} value={country.code} className="py-3">
            <div className="flex items-center space-x-3">
              <span className="text-lg min-w-[24px]">{country.flag}</span>
              <span className="font-medium">{country.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{country.code}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;


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
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {countries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center">
              <span className="mr-2">{country.flag}</span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;

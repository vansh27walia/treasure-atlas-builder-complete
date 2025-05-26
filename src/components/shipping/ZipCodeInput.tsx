
import React from 'react';
import { Input } from '@/components/ui/input';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MapPin } from 'lucide-react';

interface ZipCodeInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const ZipCodeInput: React.FC<ZipCodeInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and basic formatting
    const zipValue = e.target.value.replace(/[^\d-]/g, '');
    onChange(zipValue);
  };

  return (
    <FormItem>
      <FormLabel className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-600" />
        {label}
      </FormLabel>
      <FormControl>
        <Input
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          maxLength={10}
          className="text-lg"
        />
      </FormControl>
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
};

export default ZipCodeInput;

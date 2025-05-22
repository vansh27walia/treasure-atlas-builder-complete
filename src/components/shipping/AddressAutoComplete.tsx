
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface AddressAutoCompleteProps {
  onAddressSelected?: (address: any) => void;
  placeholder?: string;
  defaultValue?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

const AddressAutoComplete: React.FC<AddressAutoCompleteProps> = ({
  onAddressSelected,
  placeholder = 'Enter address',
  defaultValue = '',
  id,
  name,
  required = false,
  className = '',
  disabled = false,
  onChange
}) => {
  const [value, setValue] = useState(defaultValue);
  
  // Update internal state when defaultValue changes
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onChange) onChange(newValue);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        required={required}
        className={className}
        disabled={disabled}
      />
    </div>
  );
};

export default AddressAutoComplete;

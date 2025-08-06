import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, ...props }, ref) => {
    const handlePhoneFormat = (value: string) => {
      // Remove all non-digit characters except +
      const cleaned = value.replace(/[^\d+]/g, '');
      
      // If it starts with +1, format as +1-XXX-XXX-XXXX
      if (cleaned.startsWith('+1') && cleaned.length > 2) {
        const digits = cleaned.slice(2);
        if (digits.length <= 3) {
          return `+1-${digits}`;
        } else if (digits.length <= 6) {
          return `+1-${digits.slice(0, 3)}-${digits.slice(3)}`;
        } else {
          return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        }
      }
      
      // If it starts with +, keep it as is (international)
      if (cleaned.startsWith('+')) {
        return cleaned;
      }
      
      // If it's a US number without +1, add it
      if (cleaned.length === 10) {
        return `+1-${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
      
      return cleaned;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = handlePhoneFormat(e.target.value);
      e.target.value = formatted;
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        placeholder="+1-800-555-0199"
        className={cn(
          "font-mono text-sm",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };

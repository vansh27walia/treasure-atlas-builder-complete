
import React from 'react';
import { Controller, Control, FieldErrors, FieldError } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { countryOptions } from '@/lib/countries'; // Assuming countryOptions is exported from here

export interface AddressFormFieldsProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPrefix?: string;
  showDefaultToggle?: boolean;
  defaultToggleLabel?: string;
  defaultToggleField?: string; // e.g., 'is_default_from' or 'is_default_to' or a prefixed version
}

const getNestedError = (errors: FieldErrors<any>, path: string): FieldError | undefined => {
  const pathParts = path.split('.');
  let current: any = errors;
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current as FieldError;
};

const AddressFormFields: React.FC<AddressFormFieldsProps> = ({
  control,
  errors,
  fieldPrefix = '',
  showDefaultToggle = false,
  defaultToggleLabel = 'Set as default',
  defaultToggleField,
}) => {
  const getFieldName = (name: string) => `${fieldPrefix}${name}`;

  return (
    <>
      <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("name")}>Full Name</Label>
          <Controller
            name={getFieldName("name")}
            control={control}
            render={({ field }) => <Input id={getFieldName("name")} {...field} placeholder="e.g., Jane Doe" />}
          />
          {getNestedError(errors, getFieldName('name')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('name'))?.message?.toString()}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("company")}>Company (Optional)</Label>
          <Controller
            name={getFieldName("company")}
            control={control}
            render={({ field }) => <Input id={getFieldName("company")} {...field} placeholder="e.g., Acme Corp" />}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("street1")}>Street Address</Label>
          <Controller
            name={getFieldName("street1")}
            control={control}
            render={({ field }) => <Input id={getFieldName("street1")} {...field} placeholder="e.g., 123 Main St" />}
          />
          {getNestedError(errors, getFieldName('street1')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('street1'))?.message?.toString()}</p>}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("street2")}>Apartment, suite, etc. (Optional)</Label>
          <Controller
            name={getFieldName("street2")}
            control={control}
            render={({ field }) => <Input id={getFieldName("street2")} {...field} />}
          />
        </div>

        <div>
          <Label htmlFor={getFieldName("city")}>City</Label>
          <Controller
            name={getFieldName("city")}
            control={control}
            render={({ field }) => <Input id={getFieldName("city")} {...field} />}
          />
          {getNestedError(errors, getFieldName('city')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('city'))?.message?.toString()}</p>}
        </div>

        <div>
          <Label htmlFor={getFieldName("state")}>State / Province</Label>
          <Controller
            name={getFieldName("state")}
            control={control}
            render={({ field }) => <Input id={getFieldName("state")} {...field} />}
          />
          {getNestedError(errors, getFieldName('state')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('state'))?.message?.toString()}</p>}
        </div>

        <div>
          <Label htmlFor={getFieldName("zip")}>ZIP / Postal Code</Label>
          <Controller
            name={getFieldName("zip")}
            control={control}
            render={({ field }) => <Input id={getFieldName("zip")} {...field} />}
          />
          {getNestedError(errors, getFieldName('zip')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('zip'))?.message?.toString()}</p>}
        </div>

        <div>
          <Label htmlFor={getFieldName("country")}>Country</Label>
          <Controller
            name={getFieldName("country")}
            control={control}
            defaultValue="US"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || "US"}>
                <SelectTrigger id={getFieldName("country")}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {getNestedError(errors, getFieldName('country')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('country'))?.message?.toString()}</p>}
        </div>
        
        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("phone")}>Phone (Optional)</Label>
          <Controller
            name={getFieldName("phone")}
            control={control}
            render={({ field }) => <Input id={getFieldName("phone")} type="tel" {...field} placeholder="e.g., (555) 123-4567" />}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={getFieldName("email")}>Email (Optional)</Label>
          <Controller
            name={getFieldName("email")}
            control={control}
            render={({ field }) => <Input id={getFieldName("email")} type="email" {...field} placeholder="e.g., jane@example.com" />}
          />
          {getNestedError(errors, getFieldName('email')) && <p className="text-red-500 text-xs mt-1">{getNestedError(errors, getFieldName('email'))?.message?.toString()}</p>}
        </div>
        
         <div className="sm:col-span-2">
          <Controller
            name={getFieldName("is_residential")}
            control={control}
            defaultValue={true}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={getFieldName("is_residential")}
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor={getFieldName("is_residential")} className="text-sm font-normal">
                  This is a residential address
                </Label>
              </div>
            )}
          />
        </div>
      </div>

      {showDefaultToggle && defaultToggleField && (
        <div className="mt-6"> {/* Increased margin-top for better spacing */}
          <Controller
            name={defaultToggleField} // Assuming defaultToggleField is already prefixed if needed
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={defaultToggleField}
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor={defaultToggleField} className="text-sm font-normal">
                  {defaultToggleLabel}
                </Label>
              </div>
            )}
          />
        </div>
      )}
    </>
  );
};

export default AddressFormFields;


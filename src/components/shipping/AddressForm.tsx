import React from 'react';
import { useForm, Controller, UseFormReturn, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SavedAddress } from '@/types/shipping';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressFormFields from './AddressFormFields';

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  is_residential: z.boolean().optional(),
  is_default_from: z.boolean().optional(),
  is_default_to: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void;
  defaultValues?: Partial<AddressFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
  showDefaultToggle?: boolean;
  defaultToggleLabel?: string;
  defaultToggleField?: 'is_default_from' | 'is_default_to';
}

const AddressForm: React.FC<AddressFormProps> = ({
  onSubmit,
  defaultValues,
  isLoading = false,
  submitButtonText = 'Save Address',
  showDefaultToggle = false,
  defaultToggleLabel = 'Set as default',
  defaultToggleField
}) => {
  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'US', is_residential: true, ...defaultValues },
  });

  const { control, handleSubmit, formState: { errors } } = form;

  // Construct the field name for the default toggle if it's prefixed in the schema
  // For AddressForm, schema fields are top-level, so defaultToggleField is fine as is.
  // If AddressFormData includes is_default_from/to directly, this is correct.
  const toggleFieldName = defaultToggleField;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AddressFormFields 
        control={control} 
        errors={errors} 
        showDefaultToggle={showDefaultToggle}
        defaultToggleLabel={defaultToggleLabel}
        defaultToggleField={toggleFieldName}
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Saving...' : submitButtonText}
      </Button>
    </form>
  );
};

export default AddressForm;

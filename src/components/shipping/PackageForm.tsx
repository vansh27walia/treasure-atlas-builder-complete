
import React from 'react';
import { UseFormReturn, FieldErrors, DeepRequired, FieldErrorsImpl } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

// Define a basic package schema for the form
const packageSchema = z.object({
  length: z.number().min(1, "Min 1"),
  width: z.number().min(1, "Min 1"),
  height: z.number().min(1, "Min 1"),
  weight: z.number().min(0.1, "Min 0.1"),
});

export type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormProps {
  form?: UseFormReturn<any>;
  onPackageChange?: (pkg: any) => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ form, onPackageChange }) => {
  const parcelPath = (field: keyof PackageFormData) => `parcel.${field}`;
  
  // Helper to get nested errors more safely typed
  const getParcelError = (fieldName: keyof PackageFormData) => {
    if (!form) return undefined;
    const errors = form.formState.errors.parcel as FieldErrorsImpl<DeepRequired<PackageFormData>> | undefined;
    return errors?.[fieldName]?.message;
  };

  const handleInputChange = (field: string, value: number) => {
    if (onPackageChange) {
      onPackageChange({ [field]: value });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={parcelPath('length')}>Length (in)</Label>
          <Input
            id={parcelPath('length')}
            type="number"
            step="0.1"
            {...(form ? form.register(parcelPath('length'), { valueAsNumber: true }) : {})}
            onChange={(e) => handleInputChange('length', parseFloat(e.target.value) || 0)}
          />
          {getParcelError('length') && (
            <p className="text-red-500 text-xs mt-1">{getParcelError('length')}</p>
          )}
        </div>
        <div>
          <Label htmlFor={parcelPath('width')}>Width (in)</Label>
          <Input
            id={parcelPath('width')}
            type="number"
            step="0.1"
            {...(form ? form.register(parcelPath('width'), { valueAsNumber: true }) : {})}
            onChange={(e) => handleInputChange('width', parseFloat(e.target.value) || 0)}
          />
          {getParcelError('width') && (
            <p className="text-red-500 text-xs mt-1">{getParcelError('width')}</p>
          )}
        </div>
        <div>
          <Label htmlFor={parcelPath('height')}>Height (in)</Label>
          <Input
            id={parcelPath('height')}
            type="number"
            step="0.1"
            {...(form ? form.register(parcelPath('height'), { valueAsNumber: true }) : {})}
            onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 0)}
          />
          {getParcelError('height') && (
            <p className="text-red-500 text-xs mt-1">{getParcelError('height')}</p>
          )}
        </div>
        <div>
          <Label htmlFor={parcelPath('weight')}>Weight (lbs)</Label>
          <Input
            id={parcelPath('weight')}
            type="number"
            step="0.1"
            {...(form ? form.register(parcelPath('weight'), { valueAsNumber: true }) : {})}
            onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
          />
          {getParcelError('weight') && (
            <p className="text-red-500 text-xs mt-1">{getParcelError('weight')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageForm;

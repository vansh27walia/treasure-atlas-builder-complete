
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
  form: UseFormReturn<any>; // Keep <any> for now if full FormData type is complex to pass down
                           // Or make PackageFormProps generic: PackageFormProps<T extends FieldValues>
}

const PackageForm: React.FC<PackageFormProps> = ({ form }) => {
  const parcelPath = (field: keyof PackageFormData) => `parcel.${field}`;
  
  // Helper to get nested errors more safely typed
  const getParcelError = (fieldName: keyof PackageFormData) => {
    const errors = form.formState.errors.parcel as FieldErrorsImpl<DeepRequired<PackageFormData>> | undefined;
    return errors?.[fieldName]?.message;
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
            {...form.register(parcelPath('length'), { valueAsNumber: true })}
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
            {...form.register(parcelPath('width'), { valueAsNumber: true })}
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
            {...form.register(parcelPath('height'), { valueAsNumber: true })}
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
            {...form.register(parcelPath('weight'), { valueAsNumber: true })}
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

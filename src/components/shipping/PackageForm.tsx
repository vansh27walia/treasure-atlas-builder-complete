
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
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

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormProps {
  form: UseFormReturn<any>; // UseFormReturn<YourMainFormDataShape>
  // parcelFieldName?: string; // If nested e.g. 'parcel' or 'packageDetails.parcel'
}

const PackageForm: React.FC<PackageFormProps> = ({ form }) => {
  // Assuming parcel details are at the root of the form or under a 'parcel' field
  const parcelPath = (field: keyof PackageFormData) => `parcel.${field}`;

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
          {form.formState.errors?.parcel?.length && (
            <p className="text-red-500 text-xs mt-1">{String(form.formState.errors.parcel.length.message)}</p>
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
          {form.formState.errors?.parcel?.width && (
            <p className="text-red-500 text-xs mt-1">{String(form.formState.errors.parcel.width.message)}</p>
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
          {form.formState.errors?.parcel?.height && (
            <p className="text-red-500 text-xs mt-1">{String(form.formState.errors.parcel.height.message)}</p>
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
          {form.formState.errors?.parcel?.weight && (
            <p className="text-red-500 text-xs mt-1">{String(form.formState.errors.parcel.weight.message)}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PackageForm;


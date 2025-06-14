import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Package, User, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AddressSelector from './AddressSelector';
import { SavedAddress } from '@/types/shipping';
import { toast } from '@/components/ui/sonner';
import { addressService } from '@/services/AddressService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressFormFields from './AddressFormFields';

const packageSchema = z.object({
  length: z.preprocess(val => Number(val), z.number().min(0.1, "Length is required")),
  width: z.preprocess(val => Number(val), z.number().min(0.1, "Width is required")),
  height: z.preprocess(val => Number(val), z.number().min(0.1, "Height is required")),
  weight: z.preprocess(val => Number(val), z.number().min(0.1, "Weight is required")),
  value: z.preprocess(val => Number(val), z.number().optional()),
  description: z.string().optional(),
});

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  company: z.string().optional(),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required").default("US"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  is_residential: z.boolean().optional().default(true),
});

const shippingFormSchema = z.object({
  fromAddressMode: z.enum(['select', 'new']).default('select'),
  fromAddress: addressSchema,
  selectedFromAddressId: z.string().optional(),
  toAddressMode: z.enum(['select', 'new']).default('select'),
  toAddress: addressSchema,
  selectedToAddressId: z.string().optional(),
  packageDetails: packageSchema,
  saveFromAddress: z.boolean().optional().default(false),
  saveToAddress: z.boolean().optional().default(false),
});

type ShippingFormData = z.infer<typeof shippingFormSchema>;


interface EnhancedShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<ShippingFormData>;
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({ onSubmit, isLoading = false, initialData }) => {
  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fromAddressMode: 'select',
      toAddressMode: 'select',
      fromAddress: { country: 'US', is_residential: true },
      toAddress: { country: 'US', is_residential: true },
      packageDetails: { length: 0, width: 0, height: 0, weight: 0 },
      saveFromAddress: true,
      saveToAddress: true,
      ...initialData,
    },
  });

  const { control, handleSubmit, setValue, watch, formState: { errors } } = form;

  const fromAddressMode = watch('fromAddressMode');
  const toAddressMode = watch('toAddressMode');

  useEffect(() => {
    if (initialData) {
      if (initialData.selectedFromAddressId) setValue('selectedFromAddressId', initialData.selectedFromAddressId);
      if (initialData.fromAddress) setValue('fromAddress', initialData.fromAddress);
      if (initialData.selectedToAddressId) setValue('selectedToAddressId', initialData.selectedToAddressId);
      if (initialData.toAddress) setValue('toAddress', initialData.toAddress);
      if (initialData.packageDetails) setValue('packageDetails', initialData.packageDetails);
      if (typeof initialData.saveFromAddress === 'boolean') setValue('saveFromAddress', initialData.saveFromAddress);
      if (typeof initialData.saveToAddress === 'boolean') setValue('saveToAddress', initialData.saveToAddress);
    }
  }, [initialData, setValue]);
  
  const handleFromAddressSelect = (address: SavedAddress | null) => {
    setValue('selectedFromAddressId', address?.id || '');
    if (address) {
      const { id, user_id, created_at, updated_at, is_default_from, is_default_to, address_type, instructions, ...formData } = address;
      setValue('fromAddress', formData);
    }
  };

  const handleToAddressSelect = (address: SavedAddress | null) => {
    setValue('selectedToAddressId', address?.id || '');
    if (address) {
      const { id, user_id, created_at, updated_at, is_default_from, is_default_to, address_type, instructions, ...formData } = address;
      setValue('toAddress', formData);
    }
  };

  const internalSubmit = async (data: ShippingFormData) => {
    let finalData = { ...data };

    try {
      if (data.fromAddressMode === 'new' && data.saveFromAddress) {
        const savedFrom = await addressService.addAddress(data.fromAddress);
        finalData.fromAddress = savedFrom;
        finalData.selectedFromAddressId = savedFrom.id;
        toast.success("Sender address saved!");
      } else if (data.fromAddressMode === 'select' && data.selectedFromAddressId) {
         const existing = await addressService.getAddressById(data.selectedFromAddressId);
         if(existing) finalData.fromAddress = existing;
      }


      if (data.toAddressMode === 'new' && data.saveToAddress) {
        const savedTo = await addressService.addAddress(data.toAddress);
        finalData.toAddress = savedTo;
        finalData.selectedToAddressId = savedTo.id;
        toast.success("Recipient address saved!");
      } else if (data.toAddressMode === 'select' && data.selectedToAddressId) {
          const existing = await addressService.getAddressById(data.selectedToAddressId);
          if(existing) finalData.toAddress = existing;
      }
      onSubmit(finalData);
    } catch (error: any) {
      toast.error(`Error processing addresses: ${error.message}`);
      console.error("Address saving error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-8">
      {/* From Address Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><User className="mr-2 text-blue-600" />Sender Information</CardTitle>
          <CardDescription>Who is sending the package?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="fromAddressMode"
            control={control}
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={(value) => {
                field.onChange(value);
                if (value === 'new') setValue('saveFromAddress', true);
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Use Saved Address</TabsTrigger>
                  <TabsTrigger value="new">Enter New Address</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="pt-4">
                   <AddressSelector
                      selectedAddressId={watch('selectedFromAddressId')}
                      onAddressSelect={handleFromAddressSelect}
                      addressType="from"
                    />
                </TabsContent>
                <TabsContent value="new" className="pt-4 space-y-4">
                  <AddressFormFields control={control} errors={errors} fieldPrefix="fromAddress." />
                  <Controller
                    name="saveFromAddress"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="saveFromAddress" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="saveFromAddress" className="text-sm font-normal">Save this address for future use</Label>
                      </div>
                    )}
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </CardContent>
      </Card>

      {/* To Address Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><User className="mr-2 text-green-600" />Recipient Information</CardTitle>
          <CardDescription>Where is the package going?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Controller
            name="toAddressMode"
            control={control}
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={(value) => {
                field.onChange(value);
                if (value === 'new') setValue('saveToAddress', true);
              }} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Use Saved Address</TabsTrigger>
                  <TabsTrigger value="new">Enter New Address</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="pt-4">
                   <AddressSelector
                      selectedAddressId={watch('selectedToAddressId')}
                      onAddressSelect={handleToAddressSelect}
                      addressType="to"
                    />
                </TabsContent>
                <TabsContent value="new" className="pt-4 space-y-4">
                  <AddressFormFields control={control} errors={errors} fieldPrefix="toAddress." />
                  <Controller
                    name="saveToAddress"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox id="saveToAddress" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="saveToAddress" className="text-sm font-normal">Save this address for future use</Label>
                      </div>
                    )}
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </CardContent>
      </Card>
      
      {/* Package Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Package className="mr-2 text-orange-600" />Package Details</CardTitle>
          <CardDescription>Describe the package dimensions and weight.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ... package fields ... */}
          <div>
            <Label htmlFor="packageDetails.length">Length (in)</Label>
            <Controller name="packageDetails.length" control={control} render={({ field }) => <Input id="packageDetails.length" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />} />
            {errors.packageDetails?.length && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.length.message}</p>}
          </div>
          <div>
            <Label htmlFor="packageDetails.width">Width (in)</Label>
            <Controller name="packageDetails.width" control={control} render={({ field }) => <Input id="packageDetails.width" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
            {errors.packageDetails?.width && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.width.message}</p>}
          </div>
          <div>
            <Label htmlFor="packageDetails.height">Height (in)</Label>
            <Controller name="packageDetails.height" control={control} render={({ field }) => <Input id="packageDetails.height" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
            {errors.packageDetails?.height && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.height.message}</p>}
          </div>
          <div>
            <Label htmlFor="packageDetails.weight">Weight (oz)</Label>
            <Controller name="packageDetails.weight" control={control} render={({ field }) => <Input id="packageDetails.weight" type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
            {errors.packageDetails?.weight && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.weight.message}</p>}
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="packageDetails.value">Declared Value ($)</Label>
            <Controller name="packageDetails.value" control={control} render={({ field }) => <Input id="packageDetails.value" type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
          </div>
           <div className="md:col-span-2">
            <Label htmlFor="packageDetails.description">Package Contents Description</Label>
            <Controller name="packageDetails.description" control={control} render={({ field }) => <Input id="packageDetails.description" {...field} placeholder="e.g., Books, Electronics" />} />
          </div>
        </CardContent>
      </Card>

      {(Object.keys(errors).length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Please correct the errors in the form.</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading} className="w-full text-lg py-3">
        {isLoading ? 'Processing...' : 'Get Shipping Rates'} <Truck className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
};

export default EnhancedShippingForm;

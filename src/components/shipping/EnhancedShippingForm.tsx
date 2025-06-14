
import React, { useEffect } from 'react';
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
import { toast } from '@/components/ui/sonner';
import { addressService } from '@/services/AddressService';
import { SavedAddress } from '@/types/shipping';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressFormFields from './AddressFormFields';

const packageSchema = z.object({
  length: z.preprocess((val) => Number(val), z.number().min(0.1, "Length is required")),
  width: z.preprocess((val) => Number(val), z.number().min(0.1, "Width is required")),
  height: z.preprocess((val) => Number(val), z.number().min(0.1, "Height is required")),
  weight: z.preprocess((val) => Number(val), z.number().min(0.1, "Weight is required")),
  value: z.preprocess((val) => Number(val), z.number().optional()),
  description: z.string().optional()
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
  is_residential: z.boolean().optional().default(true)
});

const shippingFormSchema = z.object({
  fromAddressMode: z.enum(['select', 'new']).default('select'),
  fromAddress: addressSchema,
  selectedFromAddressId: z.string().optional(),
  toAddressMode: z.enum(['select', 'new']).default('select'),
  toAddress: addressSchema,
  selectedToAddressId: z.string().optional(),
  packageDetails: packageSchema,
  saveFromAddress: z.boolean().optional(),
  saveToAddress: z.boolean().optional()
});

type FormData = z.infer<typeof shippingFormSchema>;

interface EnhancedShippingFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
  initialData?: Partial<FormData>;
}

const EnhancedShippingForm: React.FC<EnhancedShippingFormProps> = ({ 
  onSubmit, 
  isLoading = false, 
  initialData 
}) => {
  const form = useForm<FormData>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      fromAddressMode: 'select',
      toAddressMode: 'select',
      fromAddress: {
        country: 'US',
        is_residential: true
      },
      toAddress: {
        country: 'US',
        is_residential: true
      },
      packageDetails: {
        length: 0,
        width: 0,
        height: 0,
        weight: 0
      },
      ...initialData
    }
  });

  const { control, handleSubmit, setValue, watch, formState: { errors } } = form;
  const fromAddressMode = watch('fromAddressMode');
  const toAddressMode = watch('toAddressMode');

  useEffect(() => {
    if (initialData) {
      if (initialData.selectedFromAddressId) setValue('selectedFromAddressId', initialData.selectedFromAddressId);
      if (initialData.selectedToAddressId) setValue('selectedToAddressId', initialData.selectedToAddressId);
    }
  }, [initialData, setValue]);

  const handleFromAddressSelect = (address: SavedAddress | null) => {
    setValue('selectedFromAddressId', address?.id || '');
    if (address) {
      setValue('fromAddress', address);
    }
  };

  const handleToAddressSelect = (address: SavedAddress | null) => {
    setValue('selectedToAddressId', address?.id || '');
    if (address) {
      setValue('toAddress', address);
    }
  };

  const internalSubmit = async (data: FormData) => {
    let finalData = { ...data };

    try {
      if (data.fromAddressMode === 'new' && data.saveFromAddress) {
        // Ensure required fields are present
        const addressToSave: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
          name: data.fromAddress.name || '',
          company: data.fromAddress.company || '',
          street1: data.fromAddress.street1 || '',
          street2: data.fromAddress.street2 || '',
          city: data.fromAddress.city || '',
          state: data.fromAddress.state || '',
          zip: data.fromAddress.zip || '',
          country: data.fromAddress.country || 'US',
          phone: data.fromAddress.phone || '',
          email: data.fromAddress.email || '',
          is_residential: data.fromAddress.is_residential ?? true,
        };

        const savedFrom = await addressService.addAddress(addressToSave);
        finalData.fromAddress = savedFrom;
        finalData.selectedFromAddressId = savedFrom.id;
        toast.success("Sender address saved!");
      } else if (data.fromAddressMode === 'select' && data.selectedFromAddressId) {
        const existing = await addressService.getAddressById(data.selectedFromAddressId);
        if (existing) finalData.fromAddress = existing;
      }

      if (data.toAddressMode === 'new' && data.saveToAddress) {
        // Ensure required fields are present
        const addressToSave: Omit<SavedAddress, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
          name: data.toAddress.name || '',
          company: data.toAddress.company || '',
          street1: data.toAddress.street1 || '',
          street2: data.toAddress.street2 || '',
          city: data.toAddress.city || '',
          state: data.toAddress.state || '',
          zip: data.toAddress.zip || '',
          country: data.toAddress.country || 'US',
          phone: data.toAddress.phone || '',
          email: data.toAddress.email || '',
          is_residential: data.toAddress.is_residential ?? true,
        };

        const savedTo = await addressService.addAddress(addressToSave);
        finalData.toAddress = savedTo;
        finalData.selectedToAddressId = savedTo.id;
        toast.success("Recipient address saved!");
      } else if (data.toAddressMode === 'select' && data.selectedToAddressId) {
        const existing = await addressService.getAddressById(data.selectedToAddressId);
        if (existing) finalData.toAddress = existing;
      }

      onSubmit(finalData);
    } catch (error: any) {
      toast.error(`Error processing addresses: ${error.message}`);
      console.error("Address saving error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className="space-y-8">
      {/* Sender Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 text-blue-600" />Sender Information
          </CardTitle>
          <CardDescription>Who is sending the package?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="fromAddressMode"
            control={control}
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
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
                <TabsContent value="new" className="pt-4">
                  <AddressFormFields
                    control={control}
                    errors={errors}
                    fieldPrefix="fromAddress."
                    showDefaultToggle={true}
                    defaultToggleLabel="Save as default sender address"
                    defaultToggleField="saveFromAddress"
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </CardContent>
      </Card>

      {/* Recipient Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 text-green-600" />Recipient Information
          </CardTitle>
          <CardDescription>Who is receiving the package?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="toAddressMode"
            control={control}
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
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
                <TabsContent value="new" className="pt-4">
                  <AddressFormFields
                    control={control}
                    errors={errors}
                    fieldPrefix="toAddress."
                    showDefaultToggle={true}
                    defaultToggleLabel="Save as default recipient address"
                    defaultToggleField="saveToAddress"
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </CardContent>
      </Card>

      {/* Package Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="mr-2 text-purple-600" />Package Details
          </CardTitle>
          <CardDescription>What are you shipping?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="length">Length (in)</Label>
              <Controller
                name="packageDetails.length"
                control={control}
                render={({ field }) => <Input id="length" type="number" step="0.1" {...field} />}
              />
              {errors.packageDetails?.length && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.length.message}</p>}
            </div>
            <div>
              <Label htmlFor="width">Width (in)</Label>
              <Controller
                name="packageDetails.width"
                control={control}
                render={({ field }) => <Input id="width" type="number" step="0.1" {...field} />}
              />
              {errors.packageDetails?.width && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.width.message}</p>}
            </div>
            <div>
              <Label htmlFor="height">Height (in)</Label>
              <Controller
                name="packageDetails.height"
                control={control}
                render={({ field }) => <Input id="height" type="number" step="0.1" {...field} />}
              />
              {errors.packageDetails?.height && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.height.message}</p>}
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Controller
                name="packageDetails.weight"
                control={control}
                render={({ field }) => <Input id="weight" type="number" step="0.1" {...field} />}
              />
              {errors.packageDetails?.weight && <p className="text-red-500 text-xs mt-1">{errors.packageDetails.weight.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="value">Declared Value ($) (Optional)</Label>
            <Controller
              name="packageDetails.value"
              control={control}
              render={({ field }) => <Input id="value" type="number" step="0.01" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Controller
              name="packageDetails.description"
              control={control}
              render={({ field }) => <Input id="description" {...field} />}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Processing...' : 'Get Shipping Rates'}
      </Button>
    </form>
  );
};

export default EnhancedShippingForm;

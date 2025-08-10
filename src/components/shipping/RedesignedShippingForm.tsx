import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Scale, DollarSign, Shield, AlertTriangle } from 'lucide-react';
import AddressForm from './AddressForm';
import PackageTypeSelector from './PackageTypeSelector';
import InsuranceCalculator from './InsuranceCalculator';
import HazmatSelector from './HazmatSelector';

const shippingFormSchema = z.object({
  recipientName: z.string().min(2, { message: "Recipient name must be at least 2 characters." }),
  recipientCompany: z.string().optional(),
  originName: z.string().min(2, { message: "Origin name must be at least 2 characters." }),
  originCompany: z.string().optional(),
  weight: z.number({ invalid_type_error: 'Weight is required' }).gt(0, { message: "Weight must be greater than 0." }),
  length: z.number({ invalid_type_error: 'Length is required' }).optional(),
  width: z.number({ invalid_type_error: 'Width is required' }).optional(),
  height: z.number({ invalid_type_error: 'Height is required' }).optional(),
  packageType: z.string().min(2, { message: "Package type must be selected." }),
  insuranceAmount: z.number().optional(),
  isHazmat: z.boolean().optional(),
  recipientAddress: z.object({
    street1: z.string().min(2, { message: "Street address is required" }),
    street2: z.string().optional(),
    city: z.string().min(2, { message: "City is required" }),
    state: z.string().min(2, { message: "State is required" }),
    zip: z.string().min(5, { message: "Zip code is required" }),
    country: z.string().min(2, { message: "Country is required" }),
  }),
  originAddress: z.object({
    street1: z.string().min(2, { message: "Street address is required" }),
    street2: z.string().optional(),
    city: z.string().min(2, { message: "City is required" }),
    state: z.string().min(2, { message: "State is required" }),
    zip: z.string().min(5, { message: "Zip code is required" }),
    country: z.string().min(2, { message: "Country is required" }),
  }),
});

type ShippingFormValues = z.infer<typeof shippingFormSchema>;

interface RedesignedShippingFormProps {
  onSubmit: (data: ShippingFormValues) => void;
}

const RedesignedShippingForm: React.FC<RedesignedShippingFormProps> = ({ onSubmit }) => {
  const [isInsuranceEnabled, setIsInsuranceEnabled] = useState(false);
  const [isHazmatEnabled, setIsHazmatEnabled] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState<number | undefined>(undefined);
  const [hazmatDetails, setHazmatDetails] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      recipientName: '',
      recipientCompany: '',
      originName: '',
      originCompany: '',
      weight: 1,
      length: undefined,
      width: undefined,
      height: undefined,
      packageType: 'box',
      insuranceAmount: undefined,
      isHazmat: false,
      recipientAddress: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
      },
      originAddress: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
      },
    },
  });

  const watchInsuranceAmount = watch("insuranceAmount");
  const watchIsHazmat = watch("isHazmat");

  // Update insurance amount in the form when it changes in the InsuranceCalculator
  useEffect(() => {
    setValue("insuranceAmount", insuranceAmount);
  }, [insuranceAmount, setValue]);

  // Update isHazmat in the form when it changes in the HazmatSelector
  useEffect(() => {
    setValue("isHazmat", isHazmatEnabled);
  }, [isHazmatEnabled, setValue]);

  const handleInsuranceToggle = (enabled: boolean) => {
    setIsInsuranceEnabled(enabled);
    if (!enabled) {
      setInsuranceAmount(undefined);
      setValue("insuranceAmount", undefined);
    }
  };

  const handleHazmatToggle = (enabled: boolean) => {
    setIsHazmatEnabled(enabled);
    setValue("isHazmat", enabled);
  };

  const onAddressChange = (addressType: 'recipientAddress' | 'originAddress', field: string, value: string) => {
    setValue(`${addressType}.${field}` as any, value);
  };

  const onSubmitHandler = (data: ShippingFormValues) => {
    console.log('Form data submitted:', data);

    // Prepare the data to be sent in the custom event
    const shippingData = {
      ...data,
      insuranceAmount: isInsuranceEnabled ? data.insuranceAmount : 0,
      isHazmat: isHazmatEnabled,
      hazmatDetails: isHazmatEnabled ? hazmatDetails : null,
    };

    // Dispatch a custom event with the form data
    document.dispatchEvent(new CustomEvent('shipping-form-data', {
      detail: shippingData,
    }));

    // Call the onSubmit prop to handle form submission logic
    onSubmit(data);
  };

  return (
    <Card className="bg-white shadow-lg rounded-xl border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold">Shipping Details</CardTitle>
        <CardDescription className="text-gray-500">
          Enter the necessary information to calculate shipping rates and create a label.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          {/* Recipient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">
                Recipient Name
              </Label>
              <Input
                type="text"
                id="recipientName"
                placeholder="John Doe"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("recipientName")}
              />
              {errors.recipientName && (
                <p className="text-red-500 text-sm mt-1">{errors.recipientName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="recipientCompany" className="block text-sm font-medium text-gray-700">
                Recipient Company (Optional)
              </Label>
              <Input
                type="text"
                id="recipientCompany"
                placeholder="Acme Corp"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("recipientCompany")}
              />
            </div>
          </div>

          {/* Recipient Address Form */}
          <AddressForm
            addressType="recipientAddress"
            errors={errors}
            register={register}
            setValue={setValue}
            onAddressChange={onAddressChange}
          />

          <Separator className="my-4" />

          {/* Origin Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="originName" className="block text-sm font-medium text-gray-700">
                Origin Name
              </Label>
              <Input
                type="text"
                id="originName"
                placeholder="Jane Smith"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("originName")}
              />
              {errors.originName && (
                <p className="text-red-500 text-sm mt-1">{errors.originName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="originCompany" className="block text-sm font-medium text-gray-700">
                Origin Company (Optional)
              </Label>
              <Input
                type="text"
                id="originCompany"
                placeholder="Beta Inc"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("originCompany")}
              />
            </div>
          </div>

          {/* Origin Address Form */}
          <AddressForm
            addressType="originAddress"
            errors={errors}
            register={register}
            setValue={setValue}
            onAddressChange={onAddressChange}
          />

          <Separator className="my-4" />

          {/* Package Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                Weight (lbs)
              </Label>
              <Input
                type="number"
                id="weight"
                placeholder="1.0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                {...register("weight", { valueAsNumber: true })}
              />
              {errors.weight && (
                <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="length" className="block text-sm font-medium text-gray-700">
                  Length (in)
                </Label>
                <Input
                  type="number"
                  id="length"
                  placeholder="12"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...register("length", { valueAsNumber: true })}
                />
                {errors.length && (
                  <p className="text-red-500 text-sm mt-1">{errors.length.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="width" className="block text-sm font-medium text-gray-700">
                  Width (in)
                </Label>
                <Input
                  type="number"
                  id="width"
                  placeholder="6"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...register("width", { valueAsNumber: true })}
                />
                {errors.width && (
                  <p className="text-red-500 text-sm mt-1">{errors.width.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  Height (in)
                </Label>
                <Input
                  type="number"
                  id="height"
                  placeholder="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  {...register("height", { valueAsNumber: true })}
                />
                {errors.height && (
                  <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Package Type Selector */}
          <PackageTypeSelector register={register} errors={errors} />

          <Separator className="my-4" />

          {/* Insurance Calculator */}
          <InsuranceCalculator
            isEnabled={isInsuranceEnabled}
            onToggle={handleInsuranceToggle}
            setInsuranceAmount={setInsuranceAmount}
            watchInsuranceAmount={watchInsuranceAmount}
          />

          {/* Hazmat Selector */}
          <HazmatSelector
            isEnabled={isHazmatEnabled}
            onToggle={handleHazmatToggle}
            setHazmatDetails={setHazmatDetails}
            watchIsHazmat={watchIsHazmat}
          />

          {/* Submit Button */}
          <div>
            <Button type="submit" className="w-full bg-blue-500 text-white rounded-md py-3 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
              Get Shipping Rates
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RedesignedShippingForm;
